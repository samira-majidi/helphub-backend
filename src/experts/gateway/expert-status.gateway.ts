import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseFilters } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BaseGateway } from '#src/chat/gateway/base.gateway';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '#src/redis/providers/redis.service';
import { WsCatchAllFilter } from '#src/chat/filter/ws-exception.filter';

@WebSocketGateway({ namespace: '/experts' }) // نِیم‌اسپیس اختصاصی برای نقشه و لیست متخصصین
@UseFilters(new WsCatchAllFilter())
export class ExpertsGateway extends BaseGateway {
  protected readonly logger = new Logger(ExpertsGateway.name);

  @WebSocketServer()
  declare public server: Server;

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
  ) {
    super(jwtService, redisService);
    this.logger.log('🚀 ExpertsGateway is initialized!');
  }

  // 🎧 شنیدن ایونتی که در ExpertsService شلیک کردی
  @OnEvent('expert.status.updated')
  handleExpertStatusUpdated(payload: {
    expertId: string;
    userId: number;
    status: string;
  }) {
    // 📢 پخش کردن وضعیت جدید برای همه کلاینت‌هایی که به این نِیم‌اسپیس وصل هستند
    this.server.emit('statusChanged', payload);

    this.logger.log(
      `📡 Broadcasted status update for Expert ${payload.expertId} to all clients.`,
    );
  }
}
