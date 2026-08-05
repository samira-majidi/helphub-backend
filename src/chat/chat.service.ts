import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  // این متد بعداً پیام‌ها رو تو دیتابیس ذخیره می‌کنه
  saveMessage(taskId: string, senderId: number, message: string) {
    this.logger.log(`Saving message for task ${taskId} from user ${senderId}`);

    const newMessage = {
      taskId,
      senderId,
      message,
      createdAt: new Date(),
    };

    // TODO: Save to PostgreSQL Database using TypeORM
    return newMessage;
  }
}
