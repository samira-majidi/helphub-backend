// category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { JobTitle } from '../enum/job-title.enum';
import { Expert } from './experts.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: JobTitle,
    unique: true,
  })
  name: JobTitle;

  @OneToMany(() => Expert, (expert) => expert.category)
  experts: Expert[];
}
