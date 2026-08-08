// chat.module.ts
import { Module } from '@nestjs/common';

import { AuthModule } from '#src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entity/message.entity';
import { RoomMember } from './entity/room-member.entity';
import { Room } from './entity/room.entity';
import { OwnershipModule } from '#src/auth/authorization/ownership.module';
import { ChatController } from './controller/chat.controller';
import { RedisService } from '#src/redis/providers/redis.service';
import { UploadModule } from '#src/common/upload/upload.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Room, RoomMember, Message]),
    OwnershipModule,
    UploadModule, // 👈 اضافه کردن به آرایه imports
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, RedisService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
