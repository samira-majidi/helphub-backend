import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';

import { ExpertsService } from '../providers/experts.service';

import { CreateExpertDto } from '../dto/create-expert.dto';
import { UpdateExpertDto } from '../dto/update-expert.dto';
import { UpdateExpertAvailabilityDto } from '../dto/update-expert-availability.dto';
import { SearchExpertsDto } from '../dto/search-experts.dto';
import { ExpertSearchService } from '../providers/ExpertSearchService';
import { Auth } from '#src/auth/decorators/auth.decorator';
import { AuthType } from '#src/auth/enums/auth-type.enum';

@Controller('experts')
export class ExpertsController {
  constructor(
    private readonly expertsService: ExpertsService,
    private readonly expertSearchService: ExpertSearchService,
  ) {}
  @Auth(AuthType.None)
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchExperts(@Query() searchExpertsDto: SearchExpertsDto) {
    const experts = await this.expertSearchService.search(searchExpertsDto);

    return {
      message: 'Nearby experts found successfully! 🗺️🔍',
      data: experts,
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@ActiveUser('sub') userId: number) {
    const expertProfile = await this.expertsService.getProfile(userId);

    return {
      message: 'Profile retrieved successfully. 🎉',
      data: expertProfile,
    };
  }

  @Auth(AuthType.None)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getExpertById(@Param('id', ParseUUIDPipe) expertId: string) {
    const expertProfile = await this.expertsService.getExpertById(expertId);

    return {
      message: 'Expert profile retrieved successfully! 🎯',
      data: expertProfile,
    };
  }

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
      message: 'Expert profile created successfully! 👷‍♂️',
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
      message: 'Expert availability status updated successfully. 🔄',
      data: result,
    };
  }

  @Delete('me')
  async remove(@ActiveUser('sub') userId: number) {
    return this.expertsService.remove(userId);
  }
}
