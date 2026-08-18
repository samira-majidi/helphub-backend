import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './gateway/NotificationGateway';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name); // 👈 اضافه شدن لاگر

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

      // ۱. ابتدا نمونه اولیه را از روی payload می‌سازیم
      const notification = this.notificationRepo.create(payload);

      // ۲. به صورت دستی و صریح، رابطه کاربر را ست می‌کنیم
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      notification.user = { id: payload.userId } as any;

      // ۳. ذخیره در دیتابیس
      const savedNotification = await this.notificationRepo.save(notification);

      // ۴. ارسال از طریق سوکت
      this.notificationGateway.sendToUser(
        payload.userId.toString(), // 👈 مستقیما از payload استفاده کن تا خطای undefined نگیری
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
