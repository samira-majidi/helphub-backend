import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '#src/users/user.entity';
import { Upload } from '#src/common/upload/entity/upload.entity';

@Entity('messages')
@Index('IDX_ROOM_ID_CREATED_AT', ['room_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  room_id: string;

  @Column('int', { nullable: true })
  sender_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // روابط
  @ManyToOne(() => Room, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;
  @Column({ type: 'enum', enum: ['TEXT', 'IMAGE'], default: 'TEXT' })
  type: 'TEXT' | 'IMAGE';

  @ManyToOne(() => Upload, { eager: true, nullable: true })
  @JoinColumn({ name: 'image_id' })
  image: Upload;

  @Column({ nullable: true })
  image_id: number;
}
