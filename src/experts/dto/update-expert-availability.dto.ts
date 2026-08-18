import { IsEnum } from 'class-validator';
import { ExpertAvailabilityStatus } from '../enum/expert-availability-status.enum';

export class UpdateExpertAvailabilityDto {
  @IsEnum(ExpertAvailabilityStatus, {
    message: 'وضعیت متخصص باید available، busy یا off_shift باشد.',
  })
  availabilityStatus: ExpertAvailabilityStatus;
}
