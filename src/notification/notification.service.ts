import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './gateway/NotificationGateway';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}
  // src/notification/notification.service.ts

  @OnEvent('notification.create')
  async handleNotificationEvent(payload: CreateNotificationDto): Promise<void> {
    try {
      if (!payload.userId || !payload.type) {
        this.logger.warn('Invalid notification payload received');
        return;
      }

      const notification = this.notificationRepo.create(payload);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      notification.user = { id: payload.userId } as any;

      const savedNotification = await this.notificationRepo.save(notification);

      this.notificationGateway.sendToUser(
        payload.userId.toString(),
        savedNotification,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save or send notification for user ${payload.userId}`,
        error,
      );
    }
  }
}
