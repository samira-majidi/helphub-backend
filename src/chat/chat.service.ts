import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Room, RoomType } from './entity/room.entity';
import { RoomMember } from './entity/room-member.entity';
import { Message } from './entity/message.entity';
import { GetMessagesQueryDto } from './dto/getMessagequery.dto';
import { RedisService } from '#src/redis/providers/redis.service';
import { UploadToAwsProvider } from '#src/common/upload/providers/upload-to-aws.provider';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly uploadToAwsProvider: UploadToAwsProvider, // 👈 اینجا اضافه شد
  ) {}

  async findOrCreateDirectRoom(
    currentUserId: number,
    targetUserId: number,
  ): Promise<Room> {
    if (currentUserId === targetUserId) {
      this.logger.warn(
        `User ${currentUserId} attempted to create a direct chat with themselves.`,
      );
      throw new BadRequestException('You cannot send a message to yourself.');
    }

    this.logger.log(
      `Initiating direct room process for users: ${currentUserId} and ${targetUserId}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockKey =
        Math.min(currentUserId, targetUserId) * 1000000 +
        Math.max(currentUserId, targetUserId);

      await queryRunner.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

      const existingRoom = await queryRunner.manager
        .createQueryBuilder(Room, 'room')
        .innerJoin('room.members', 'm1', 'm1.user_id = :userId1', {
          userId1: currentUserId,
        })
        .innerJoin('room.members', 'm2', 'm2.user_id = :userId2', {
          userId2: targetUserId,
        })
        .innerJoin('room.members', 'm_all')
        .where('room.type = :type', { type: RoomType.DIRECT })
        .groupBy('room.id')
        .having('COUNT(m_all.room_id) = 2')
        .getOne();

      if (existingRoom) {
        await queryRunner.commitTransaction();
        this.logger.debug(
          `Found existing direct room (ID: ${existingRoom.id}) for users ${currentUserId} and ${targetUserId}.`,
        );
        return existingRoom;
      }

      const newRoom = queryRunner.manager.create(Room, {
        type: RoomType.DIRECT,
      });
      const savedRoom = await queryRunner.manager.save(newRoom);

      const members = [currentUserId, targetUserId].map((userId) =>
        queryRunner.manager.create(RoomMember, {
          room_id: savedRoom.id,
          user_id: userId,
        }),
      );

      await queryRunner.manager.save(members);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully created a new direct room (ID: ${savedRoom.id}) for users ${currentUserId} and ${targetUserId}.`,
      );

      return savedRoom;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to find or create direct room for users ${currentUserId} and ${targetUserId}. Error: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to find or create direct room for users ${currentUserId} and ${targetUserId}. Error: ${String(error)}`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to process the direct chat room. Please try again later.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async saveDirectMessage(
    roomId: string,
    senderId: number,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    imageId?: number,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      room_id: roomId,
      sender_id: senderId,
      content: content || '',
      type: type,
      image_id: imageId,
    });

    return await this.messageRepository.save(newMessage);
  }

  async getRoomMessages(
    roomId: string,
    query: GetMessagesQueryDto,
    currentUserId: number,
  ) {
    const { limit = 20, cursor } = query;

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.image', 'image')
      .where('message.room_id = :roomId', { roomId })
      .orderBy('message.created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      queryBuilder.andWhere('message.id < :cursor', { cursor });
    }

    const messages = await queryBuilder.getMany();

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      messages.pop();
      nextCursor = messages[messages.length - 1].id;
    }

    const reversedMessages = messages.reverse();

    const mappedMessages = await Promise.all(
      reversedMessages.map(async (msg) => {
        if (msg.image && msg.image.isPrivate) {
          const presignedUrl = await this.uploadToAwsProvider.getPresignedUrl(
            msg.image.name,
          );

          return {
            ...msg,
            image: {
              ...msg.image,
              path: presignedUrl,
            },
          };
        }
        return msg;
      }),
    );

    return {
      data: mappedMessages,
      nextCursor,
    };
  }

  async updateUserLastSeen(userId: number): Promise<void> {
    const currentTime = Date.now();
    const redisKey = `user:${userId}:last_seen`;

    try {
      await this.redisService.set(redisKey, currentTime, 604800);
      this.logger.log(`User ${userId} last_seen updated to ${currentTime}`);
    } catch (error) {
      this.logger.error(`Failed to update last_seen for user ${userId}`, error);
    }
  }

  async getUserConversations(userId: number) {
    return await this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.members', 'myMember', '"myMember"."user_id" = :userId', {
        userId,
      })
      .innerJoinAndSelect(
        'room.members',
        'otherMember',
        '"otherMember"."user_id" != :userId',
        { userId },
      )
      .innerJoinAndSelect('otherMember.user', 'user')
      .getMany();
  }
}
