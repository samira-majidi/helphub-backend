import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendDirectMessageDto {
  @IsString({ message: 'شناسه اتاق باید یک رشته (String) باشد.' })
  @IsNotEmpty({ message: 'شناسه اتاق نمی‌تواند خالی باشد.' })
  roomId: string;

  @IsString({ message: 'محتوای پیام باید متن باشد.' })
  @IsNotEmpty({ message: 'پیام نمی‌تواند خالی باشد.' })
  content: string;
  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE'], { message: 'نوع پیام نامعتبر است.' })
  type?: 'TEXT' | 'IMAGE';

  @IsOptional()
  @IsNumber({}, { message: 'شناسه تصویر باید عدد باشد.' })
  imageId?: number;
}
