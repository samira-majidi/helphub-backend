import { IsNumber, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchExpertsDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(100) // Minimum radius 100 meters
  @Type(() => Number)
  radius?: number = 5000; // Default 5km

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  // 👇 Pagination fields added
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Maximum 100 records per page for safety
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}
