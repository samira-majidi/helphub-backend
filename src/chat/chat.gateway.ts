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
    super.handleConnection(client);

    const userId = client.user?.sub || client.data?.user?.sub;

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
    await super.handleDisconnect(client);

    const userId = client.user?.sub || client.data?.user?.sub;
    if (!userId) return;

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

    // ۱. آپدیت زمان بازدید دیتابیس به محض ورود کاربر
    const readAtIso = new Date().toISOString();
    await this.chatService.updateRoomLastReadAt(room.id, Number(currentUserId));

    // ۲. اطلاع به طرف مقابل در اتاق سوکت که پیام‌هایش خوانده شد
    client.to(roomName).emit('messages_read', {
      roomId: room.id,
      userId: String(currentUserId),
      readAt: readAtIso,
    });

    const lastSeenStr = await this.redisService.get(
      `user:${data.targetUserId}:last_seen`,
    );

    const targetUserLastSeen = lastSeenStr ? Number(lastSeenStr) : null;
    const targetStatus = await this.redisService.get(
      `user:${data.targetUserId}:status`,
    );
    const isTargetOnline = targetStatus === 'online';
    const targetMember = await this.chatService.getRoomMember(
      room.id,
      data.targetUserId,
    );
    const targetUserLastReadAt = targetMember?.last_read_at
      ? targetMember.last_read_at.toISOString()
      : null;

    this.logger.log(
      `User ${currentUserId} joined direct room: ${roomName} with User ${data.targetUserId} status: ${targetStatus} and marked messages as read`,
    );

    return {
      event: 'joinedRoom',
      data: {
        roomId: room.id,
        roomName,
        targetUserLastSeen,
        isTargetOnline,
        targetUserLastReadAt,
        message: 'Joined successfully',
      },
    };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
    @ActiveUser('sub') currentUserId: number,
  ) {
    const roomName = `room_${payload.roomId}`;

    try {
      const readAtIso = new Date().toISOString();
      await this.chatService.updateRoomLastReadAt(
        payload.roomId,
        Number(currentUserId),
      );

      client.leave(roomName);

      client.to(roomName).emit('messages_read', {
        roomId: payload.roomId,
        userId: String(currentUserId),
        readAt: readAtIso,
      });

      this.logger.log(`User ${currentUserId} left room: ${roomName}`);
      return { status: 'left_room', roomId: payload.roomId };
    } catch (error) {
      this.logger.error(`Error leaving room ${payload.roomId}`, error);
      throw new WsException('Failed to leave room');
    }
  }

  @SubscribeMessage('sendDirectMessage')
  async handleDirectMessage(
    @MessageBody() payload: SendDirectMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
    @ActiveUser('sub') currentUserId: number,
  ) {
    try {
      const roomName = `room_${payload.roomId}`;
      console.log('Received in Gateway:', payload);

      const savedMessage = await this.chatService.saveDirectMessage(
        payload.roomId,
        Number(currentUserId),
        payload.content,
        payload.type,
        payload.imageId,
        payload.audioId,
      );

      this.server.to(roomName).emit('newMessage', savedMessage);

      this.logger.log(`User ${currentUserId} sent a message to ${roomName}`);

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
    client.to(roomName).emit('userTyping', { isTyping: payload.isTyping });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
    @ActiveUser('sub') currentUserId: number,
  ) {
    const roomName = `room_${payload.roomId}`;

    try {
      const readAtIso = new Date().toISOString();
      await this.chatService.updateRoomLastReadAt(
        payload.roomId,
        Number(currentUserId),
      );

      client.to(roomName).emit('messages_read', {
        roomId: payload.roomId,
        userId: String(currentUserId),
        readAt: readAtIso,
      });

      return { status: 'success', readAt: readAtIso };
    } catch (error) {
      this.logger.error(
        `Error marking messages as read for room ${payload.roomId}`,
        error,
      );
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }
}
