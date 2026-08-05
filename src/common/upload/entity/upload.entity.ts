import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { fileType } from '../interface/file.types.enum';
import { User } from '#src/users/user.entity';
@Entity()
export class Upload {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  name: string;
  @Column({
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  path: string;
  @Column({
    type: 'enum',
    enum: fileType,
    default: fileType.IMAGE,
    nullable: false,
  })
  type: fileType;
  @Column({
    type: 'varchar',
    length: 128,
    nullable: false,
  })
  mime: string;
  @Column({
    nullable: false,
  })
  size: number;
  @Column({ default: false })
  isAttached: boolean;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @CreateDateColumn()
  createDate: Date;
  @UpdateDateColumn()
  updateDate: Date;
}
