import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoomMember } from './room-member.entity';
import { Message } from './message.enity';

export enum RoomType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.DIRECT })
  type: RoomType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // روابط (Relations)
  @OneToMany(() => RoomMember, (roomMember) => roomMember.room)
  members: RoomMember[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
