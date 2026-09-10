import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './gateway/NotificationGateway';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
