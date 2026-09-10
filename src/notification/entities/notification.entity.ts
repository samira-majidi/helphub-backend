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


  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;


  @Column()
  title: string;


  @Column({ type: 'text' })
  message: string;

 
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;


  @Column({ default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
