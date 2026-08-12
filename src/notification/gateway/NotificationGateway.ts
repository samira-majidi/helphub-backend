import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { BaseGateway } from '#src/chat/gateway/base.gateway';
import { RedisService } from '#src/redis/providers/redis.service';
import { WsCatchAllFilter } from '#src/chat/filter/ws-exception.filter';
import type { AuthenticatedSocket } from '#src/chat/interface/authenticated-socket.interface';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '#src/chat/interface/authenticated-socket.interface';

@WebSocketGateway({ namespace: '/notification' })
@UseFilters(new WsCatchAllFilter())
export class NotificationGateway
  extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  declare public server: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
  ) {
    super(jwtService, redisService);
    console.log('🚀 NotificationGateway is initialized!');
  }

  // دقت کن: afterInit حذف شد!

  handleConnection(client: AuthenticatedSocket) {
    super.handleConnection(client);
    const userId = client.user?.sub || client.data?.user?.sub;
    if (!userId) {
      this.logger.warn('No userId found! Connection rejected.');
      client.disconnect();
      return;
    }

    client.join(userId.toString());
    this.logger.log(`🟢 User ${userId} connected to Notifications Room`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    await super.handleDisconnect(client);
    const userId = client.user?.sub || client.data?.user?.sub;
    if (!userId) return;

    this.logger.log(`🔴 User ${userId} disconnected from Notifications Room`);
  }

  sendToUser(
    userId: string,
    payload: Parameters<ServerToClientEvents['newNotification']>[0],
  ): void {
    this.server.to(userId).emit('newNotification', payload);
    this.logger.log(
      `🚀 Notification [${payload.type}] sent to user room [${userId}]`,
    );
  }
}
