import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import * as geojson from 'geojson';
import { User } from '#src/users/user.entity';
import { Category } from './categories.entity';
import { Upload } from '#src/common/upload/entity/upload.entity';
import { ExpertAvailabilityStatus } from '../enum/expert-availability-status.enum';
// مسیر رو چک کن

@Entity('experts')
export class Expert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: geojson.Point;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: ExpertAvailabilityStatus,
    default: ExpertAvailabilityStatus.OFF_SHIFT,
  })
  availabilityStatus: ExpertAvailabilityStatus;

  // ارتباط با جدول کاربران
  @OneToOne(() => User, (user) => user.expert, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) // این خط یه ستون userId تو جدول experts می‌سازه
  user: User;

  @ManyToOne(() => Category, (category) => category.experts)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToOne(() => Upload, { nullable: true })
  @JoinColumn({ name: 'avatarId' })
  avatar: Upload;
}
