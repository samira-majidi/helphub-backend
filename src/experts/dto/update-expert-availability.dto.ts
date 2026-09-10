import { IsEnum } from 'class-validator';
import { ExpertAvailabilityStatus } from '../enum/expert-availability-status.enum';

export class UpdateExpertAvailabilityDto {
  @IsEnum(ExpertAvailabilityStatus, {
    message: 'Expert status must be available, busy, or off_shift.',
  })
  availabilityStatus: ExpertAvailabilityStatus;
}
