import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module'; // مسیر رو متناسب با پروژه‌ات درست کن

@Module({
  imports: [AuthModule], // 👈 اینجا AuthModule رو اضافه کن
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
