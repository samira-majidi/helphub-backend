import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class JoinDirectRoomDto {
  @IsInt({ message: 'Target User ID must be an integer.' })
  @IsPositive({ message: 'Target User ID must be a positive number.' })
  @IsNotEmpty({ message: 'Target User ID is required.' })
  targetUserId: number;
}
