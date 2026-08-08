import { IsString, Matches, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUploadDto {
  @IsString()
  filename: string;

  @IsString()
  @Matches(/^(image\/png|image\/jpeg|image\/webp)$/, {
    message: 'فقط فرمت‌های png, jpeg و webp مجاز هستند',
  })
  contentType: string;

  // 👇 این قسمت اضافه میشه
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true) // تبدیل استرینگ 'true' از FormData به بولین
  @IsBoolean()
  isPrivate?: boolean;
}
