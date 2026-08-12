import {
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsAuthMiddleware } from '../middleware/ws-auth.middleware';
import { AuthenticatedSocket } from '../interface/authenticated-socket.interface';
import { RedisService } from '#src/redis/providers/redis.service';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  public server!: Server;

  protected abstract logger: Logger;

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    server.use(WsAuthMiddleware(this.jwtService));
    this.logger.log(
      `WsAuthMiddleware initialized for namespace: ${server.sockets.name}`,
    );
  }

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.data?.user?.sub;
    this.logger.log(`Client connected: ${client.id} | User ID: ${userId}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    // 👈 async شد
    const userId = client.data?.user?.sub;
    this.logger.log(`Client disconnected: ${client.id}`);

    // 👈 لاجیک آپدیت last_seen اومد اینجا
    if (userId) {
      const currentTime = Date.now();
      const redisKey = `user:${userId}:last_seen`;
      try {
        await this.redisService.set(redisKey, currentTime, 604800); // انقضا: ۷ روز
      } catch (error) {
        this.logger.error(
          `Failed to update last_seen for user ${userId}`,
          error,
        );
      }
    }
  }
}
