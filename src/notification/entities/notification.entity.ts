import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '#src/users/user.entity';
import { NotificationType } from '../type/notificationType';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  // نوع نوتیفیکیشن برای اینکه فرانت‌اند بدونه چه آیکون یا لینکی نشون بده
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  // عنوان نوتیفیکیشن
  @Column()
  title: string;

  // متن اصلی یا دیتای اضافی (می‌تونه JSON باشه تا دیتای کاستوم بفرستی)
  @Column({ type: 'text' })
  message: string;

  // دیتای جانبی (مثلاً آیدی چت یا لینک پروفایل)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // وضعیت خوانده شدن
  @Column({ default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
