import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsOwnershipGuard } from './gaurd/ws-ownership.guard';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';
import type { AuthenticatedSocket } from './interface/authenticated-socket.interface';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    // استفاده از میدل‌ویر احراز هویت
    server.use(WsAuthMiddleware(this.jwtService));
    this.logger.log('WsAuthMiddleware initialized.');
  }

  // استفاده از تایپ AuthenticatedSocket
  handleConnection(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;
    this.logger.log(`Client connected: ${client.id} | User ID: ${userId}`);
  }

  // استفاده از تایپ AuthenticatedSocket
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsOwnershipGuard)
  @SubscribeMessage('joinTaskRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `task_${data.roomId}`;
    client.join(roomName);
    this.logger.log(`User ${client.data.user?.sub} joined room: ${roomName}`);

    // برگرداندن داده متناسب با اینترفیس ClientToServerEvents
    return {
      event: 'joinedRoom',
      data: { roomId: data.roomId, message: 'Joined successfully' },
    };
  }

  @UseGuards(WsOwnershipGuard)
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { roomId: string; content: string }, // هماهنگ با تایپ ClientToServerEvents
    @ActiveUser('sub') senderId: number,
  ) {
    const roomName = `task_${data.roomId}`;
    this.logger.log(
      `Received message from User ${senderId} in room ${roomName}: "${data.content}"`,
    );

    const mockMessage = {
      id: Math.random().toString(36).substring(7), // یه آیدی موقت
      content: data.content,
      senderId: String(senderId), // تبدیل به استرینگ طبق اینترفیس
      createdAt: new Date(),
    };

    // ارسال پیام طبق تایپ ServerToClientEvents
    this.server.to(roomName).emit('newMessage', mockMessage);

    return { status: 'success' };
  }
}
