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
import { EventEmitter2 } from '@nestjs/event-emitter';

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
    private readonly uploadToAwsProvider: UploadToAwsProvider,
    private readonly eventEmitter: EventEmitter2,
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
    type?: 'TEXT' | 'IMAGE' | 'AUDIO',
    imageId?: number,
    audioId?: number,
  ): Promise<Message> {
    // ۱. ساخت و ذخیره اولیه پیام در دیتابیس
    const newMessage = this.messageRepository.create({
      room_id: roomId,
      sender_id: senderId,
      content: content || '',
      type: type,
      image_id: imageId,
      audio_id: audioId,
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    // ۲. فراخوانی مجدد پیام همراه با روابط عکس و صدا
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['image', 'audio'],
    });

    if (!messageWithRelations) {
      return savedMessage;
    }

    // ۳. تولید Presigned URL (همون کدهای خودت)
    if (messageWithRelations.type === 'IMAGE' && messageWithRelations.image) {
      messageWithRelations.image.path =
        await this.uploadToAwsProvider.getPresignedUrl(
          messageWithRelations.image.name,
        );
    } else if (
      messageWithRelations.type === 'AUDIO' &&
      messageWithRelations.audio
    ) {
      messageWithRelations.audio.path =
        await this.uploadToAwsProvider.getPresignedUrl(
          messageWithRelations.audio.name,
        );
    }

    // 🌟 ۴. پیدا کردن گیرنده پیام برای ارسال نوتیفیکیشن
    try {
      const receiver = await this.roomMemberRepository
        .createQueryBuilder('roomMember')
        .where('roomMember.room_id = :roomId', { roomId })
        .andWhere('roomMember.user_id != :senderId', { senderId })
        .getOne();

      if (receiver) {
        // 🌟 ۵. شلیک رویداد نوتیفیکیشن
        this.eventEmitter.emit('notification.create', {
          userId: String(receiver.user_id), // اینجا اگر آیدی عدده به استرینگ تبدیل کردیم تا گیر نده
          type: 'NEW_MESSAGE', // مقدار تایپت رو از Enum خودت بذار (مثلا NotificationType.NEW_MESSAGE)
          title: 'new message',
          message: content
            ? content.substring(0, 50)
            : 'شما یک پیام جدید دارید', // پیش‌نمایش پیام
          metadata: {
            roomId: roomId,
            messageId: savedMessage.id,
            senderId: senderId,
          },
        });
        this.logger.log(
          `Notification event emitted for user ${receiver.user_id}`,
        );
      }
    } catch (error) {
      // خطا در ارسال نوتیفیکیشن نباید کل پروسه چت رو متوقف کنه
      this.logger.error(
        `Failed to emit notification for room ${roomId}`,
        error,
      );
    }

    // ۶. برگرداندن پیام کامل برای ارسال به سوکت چت
    return messageWithRelations;
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
      .leftJoinAndSelect('message.audio', 'audio')
      .where('message.room_id = :roomId', { roomId })
      .orderBy('message.created_at', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .take(limit + 1);
    if (cursor) {
      const cursorMessage = await this.messageRepository.findOne({
        where: { id: cursor },
        select: ['id', 'created_at'],
      });

      if (cursorMessage) {
        queryBuilder.andWhere(
          '(message.created_at < :cursorDate OR (message.created_at = :cursorDate AND message.id < :cursorId))',
          {
            cursorDate: cursorMessage.created_at,
            cursorId: cursorMessage.id,
          },
        );
      } else {
        queryBuilder.andWhere('message.id < :cursor', { cursor });
      }
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
        let updatedImage = msg.image;
        let updatedAudio = msg.audio;
        if (msg.image && msg.image.isPrivate) {
          const presignedUrl = await this.uploadToAwsProvider.getPresignedUrl(
            msg.image.name,
          );
          updatedImage = { ...msg.image, path: presignedUrl };
        }

        // 👈 ۲. هندل کردن لینک ویس‌ها (جدید)
        if (msg.audio && msg.audio.isPrivate) {
          const presignedUrl = await this.uploadToAwsProvider.getPresignedUrl(
            msg.audio.name,
          );
          updatedAudio = { ...msg.audio, path: presignedUrl };
        }

        return {
          ...msg,
          image: updatedImage,
          audio: updatedAudio,
        };
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
