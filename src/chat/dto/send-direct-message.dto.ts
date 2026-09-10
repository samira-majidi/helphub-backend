import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendDirectMessageDto {
  @IsString({ message: 'Room ID must be a string.' })
  @IsNotEmpty({ message: 'Room ID cannot be empty.' })
  roomId: string;

  @IsString({ message: 'Message content must be a string.' })
  @IsNotEmpty({ message: 'Message content cannot be empty.' })
  @MaxLength(2000, {
    message: 'Message content cannot exceed 2000 characters.',
  })
  content: string;

  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'AUDIO'], { message: 'Invalid message type.' })
  type?: 'TEXT' | 'IMAGE' | 'AUDIO';

  @IsOptional()
  @IsNumber({}, { message: 'Image ID must be a number.' })
  imageId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Audio ID must be a number.' })
  audioId?: number;
}
