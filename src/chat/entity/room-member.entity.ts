import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '#src/users/user.entity';
// import { User } from '../users/user.entity'; // مسیر دقیق فایل User خودت رو بده

@Entity('room_members')
@Index('IDX_USER_ID', ['user_id']) // ایندکس برای جستجوی سریع اتاق‌های یک کاربر
export class RoomMember {
  // استفاده از کلید ترکیبی (Composite Primary Key)
  @PrimaryColumn('uuid')
  room_id: string;

  @PrimaryColumn('int') // با توجه به کد قبلی، آیدی کاربر از نوع عدد در نظر گرفته شده
  user_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;

  // روابط
  @ManyToOne(() => Room, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
