import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';
import { NotificationType } from '../type/notificationType';

export class CreateNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
