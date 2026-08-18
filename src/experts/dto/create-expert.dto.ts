import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExpertDto {
  @IsNotEmpty({ message: 'انتخاب دسته‌بندی شغلی الزامی است' })
  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'بیو نباید بیشتر از ۵۰۰ کاراکتر باشد' })
  bio?: string;
}
