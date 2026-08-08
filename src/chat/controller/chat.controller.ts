import { OwnershipGuard } from '#src/auth/authorization/ownership.guard';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from '../chat.service';
import { GetMessagesQueryDto } from '../dto/getMessagequery.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  @UseGuards(OwnershipGuard)
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesQueryDto,
    @ActiveUser('sub') currentUserId: number,
  ) {
    return await this.chatService.getRoomMessages(roomId, query, currentUserId);
  }

  @Get('conversations')
  async getConversations(@ActiveUser('sub') currentUserId: number) {
    return await this.chatService.getUserConversations(currentUserId);
  }
}
