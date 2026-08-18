import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
  Get,
} from '@nestjs/common';
// مسیر این ایمپورت‌ها رو بر اساس ساختار پروژه‌ات تنظیم کن:
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';

import { ExpertsService } from '../providers/experts.service';
import { CreateExpertDto } from '../dto/create-expert.dto';
import { UpdateExpertDto } from '../dto/update-expert.dto';
import { UpdateExpertAvailabilityDto } from '../dto/update-expert-availability.dto';

@Controller('experts')
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@ActiveUser('sub') userId: number) {
    // مستقیم می‌فرستیم برای سرویسی که نوشتیم
    const expertProfile = await this.expertsService.getProfile(userId);

    // یه پاسخ خوشگل و مرتب برمی‌گردونیم
    return {
      message: 'پروفایل شما با موفقیت دریافت شد. 🎉',
      data: expertProfile,
    };
  }
  //
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpert(
    @Body() createExpertDto: CreateExpertDto,
    @ActiveUser('sub') currentUserId: number,
  ) {
    const expert = await this.expertsService.create(
      createExpertDto,
      currentUserId,
    );
    return {
      message: 'پروفایل متخصص با موفقیت ایجاد شد! 👷‍♂️',
      data: expert,
    };
  }
  @Patch('me')
  async update(
    @Body() updateExpertDto: UpdateExpertDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.expertsService.update(updateExpertDto, userId);
  }

  @Patch('me/availability')
  async updateAvailabilityStatus(
    @Body() updateExpertAvailabilityDto: UpdateExpertAvailabilityDto,
    @ActiveUser('sub') userId: number,
  ) {
    const result = await this.expertsService.updateAvailabilityStatus(
      userId,
      updateExpertAvailabilityDto,
    );

    return {
      message: 'وضعیت متخصص با موفقیت تغییر کرد.',
      data: result,
    };
  }
  @Delete('me')
  async remove(@ActiveUser('sub') userId: number) {
    return this.expertsService.remove(userId);
  }
}
