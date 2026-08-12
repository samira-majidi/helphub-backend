import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BaseGateway } from './gateway/base.gateway';
// import { WsOwnershipGuard } from './gaurd/ws-ownership.guard'; // اگر نیاز بود آن‌کامنت کن
import type { AuthenticatedSocket } from './interface/authenticated-socket.interface';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';
import { ChatService } from './chat.service';
import { JoinDirectRoomDto } from './dto/join-direct-room.dto';
import { WsCatchAllFilter } from './filter/ws-exception.filter';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { RedisService } from '#src/redis/providers/redis.service';

@WebSocketGateway({ namespace: '/chat' })
@UseFilters(new WsCatchAllFilter())
export class ChatGateway
  extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly logger = new Logger(ChatGateway.name);

  constructor(
    protected readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    protected readonly redisService: RedisService,
  ) {
    super(jwtService, redisService);
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async handleConnection(client: AuthenticatedSocket) {
    // ۱. متد کلاس پدر رو مستقیماً صدا می‌زنیم (بدون if)
    super.handleConnection(client);

    // ۲. چک کردن آیدی هم از data و هم از خود کلاینت تا خیالمون راحت باشه
    const userId = client.user?.sub || client.data?.user?.sub;

    // لاگ برای دیباگ که مطمئن بشیم آیدی رو داریم
    if (!userId) {
      this.logger.warn(
        `Client ${client.id} connected but client.user is missing!`,
      );
      return;
    }

    await this.redisService.set(`user:${userId}:status`, 'online', 0);
    this.server.emit('userStatusChanged', { userId, status: 'online' });
    this.logger.log(`🟢 User ${userId} is Online`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    // صدا زدن متد کلاس پدر با await (بدون if)
    await super.handleDisconnect(client);

    const userId = client.user?.sub || client.data?.user?.sub;
    if (!userId) return;

    // بقیه کدهای دیس‌کانکت...
    await this.redisService.del(`user:${userId}:status`);
    await this.chatService.updateUserLastSeen(userId);

    const lastSeen = Date.now();
    this.server.emit('userStatusChanged', {
      userId,
      status: 'offline',
      lastSeen,
    });
    this.logger.log(`🔴 User ${userId} is Offline`);
  }
  @SubscribeMessage('joinDirectRoom')
  async handleJoinDirectRoom(
    @MessageBody() data: JoinDirectRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
    @ActiveUser('sub') currentUserId: number,
  ) {
    const room = await this.chatService.findOrCreateDirectRoom(
      currentUserId,
      data.targetUserId,
    );

    const roomName = `room_${room.id}`;
    client.join(roomName);

    const lastSeenStr = await this.redisService.get(
      `user:${data.targetUserId}:last_seen`,
    );

    const targetUserLastSeen = lastSeenStr ? Number(lastSeenStr) : null;
    const targetStatus = await this.redisService.get(
      `user:${data.targetUserId}:status`,
    );
    const isTargetOnline = targetStatus === 'online';
    this.logger.log(
      `User ${currentUserId} joined direct room: ${roomName} with User ${data.targetUserId} status: ${targetStatus}`,
    );
    this.logger.log(
      `User ${currentUserId} joined direct room: ${roomName} with User ${data.targetUserId}`,
    );

    return {
      event: 'joinedRoom',
      data: {
        roomId: room.id,
        roomName,
        targetUserLastSeen,
        isTargetOnline,
        message: 'Joined successfully',
      },
    };
  }

  @SubscribeMessage('sendDirectMessage')
  async handleDirectMessage(
    // برای تمیزی بیشتر در آینده می‌تونی این آبجکت رو تبدیل به SendDirectMessageDto کنی
    @MessageBody() payload: SendDirectMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
    @ActiveUser('sub') currentUserId: number,
  ) {
    try {
      const roomName = `room_${payload.roomId}`;
      console.log('Received in Gateway:', payload);
      // ۱. ذخیره پیام واقعی در دیتابیس (با تبدیل صریح به عدد برای جلوگیری از خطای TypeORM)
      const savedMessage = await this.chatService.saveDirectMessage(
        payload.roomId,
        Number(currentUserId),
        payload.content,
        payload.type, // پاس دادن type
        payload.imageId,
        payload.audioId,
      );

      // ۲. برودکست کردن پیامِ ذخیره شده به همه اعضای اتاق
      this.server.to(roomName).emit('newMessage', savedMessage);

      // ثبت لاگ برای دیباگ راحت‌تر
      this.logger.log(`User ${currentUserId} sent a message to ${roomName}`);

      // ۳. ارسال تاییدیه (Acknowledgement) به فرستنده
      return { status: 'success', data: savedMessage };
    } catch (error) {
      this.logger.error(`Error saving direct message in`, error);
      throw new WsException('Failed to save and send message');
    }
  }
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `room_${payload.roomId}`;
    // ارسال وضعیت تایپ به همه اعضای اتاق به جز کسی که داره تایپ می‌کنه
    client.to(roomName).emit('userTyping', { isTyping: payload.isTyping });
  }
}
