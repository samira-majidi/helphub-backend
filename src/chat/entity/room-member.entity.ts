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
import { Column } from 'typeorm';

@Entity('room_members')
@Index('IDX_USER_ID', ['user_id'])
export class RoomMember {
  @PrimaryColumn('uuid')
  room_id: string;

  @PrimaryColumn('int')
  user_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_read_at: Date;

  // روابط
  @ManyToOne(() => Room, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
