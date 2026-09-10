import { IsString, Matches, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUploadDto {
  @IsString()
  filename: string;

  @IsString()
  @Matches(/^(image\/png|image\/jpeg|image\/webp)$/, {
    message: 'Only png, jpeg and webp formats are allowed',
  })
  contentType: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPrivate?: boolean;
}
