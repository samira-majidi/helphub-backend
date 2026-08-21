import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expert } from '../entity/experts.entity';
import { ExpertAvailabilityStatus } from '../enum/expert-availability-status.enum';
import { SearchExpertsDto } from '../dto/search-experts.dto';

@Injectable()
export class ExpertSearchService {
  private readonly logger = new Logger(ExpertSearchService.name);

  constructor(
    @InjectRepository(Expert)
    private readonly expertRepository: Repository<Expert>,
  ) {}

  public async search(searchDto: SearchExpertsDto): Promise<Expert[]> {
    const {
      latitude,
      longitude,
      radius = 5000,
      categoryId,
      limit = 20,
      page = 1,
    } = searchDto;

    this.logger.debug(
      `🔍 Search initiated - Coordinates: [${latitude}, ${longitude}] | Radius: ${radius}m | Category: ${categoryId ?? 'All'}`,
    );

    const query = this.expertRepository
      .createQueryBuilder('expert')
      .leftJoinAndSelect('expert.category', 'category')
      .leftJoinAndSelect('expert.avatar', 'avatar')
      .leftJoinAndSelect('expert.user', 'user')
      .where(
        `ST_DWithin(
          expert.location, 
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
          :radius
        )`,
      )
      .setParameters({
        lon: longitude,
        lat: latitude,
        radius: radius,
      });

    // Apply category filter if provided
    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
      this.logger.verbose(`Applied category filter with ID: ${categoryId}`);
    }

    query
      // Priority 1: Expert status (AVAILABLE > BUSY > OFF_SHIFT)
      .addSelect(
        // تغییر مهم: اضافه کردن دابل‌کوتیشن دور اسم جدول و ستون
        `CASE "expert"."availabilityStatus"
          WHEN '${ExpertAvailabilityStatus.AVAILABLE}' THEN 1
          WHEN '${ExpertAvailabilityStatus.BUSY}' THEN 2
          WHEN '${ExpertAvailabilityStatus.OFF_SHIFT}' THEN 3
          ELSE 4
        END`,
        'status_order',
      )
      .addSelect(
        // بهتره برای location هم همین کار رو بکنیم تا ساختار یکدست بشه
        `"expert"."location" <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography`,
        'distance',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('distance', 'ASC')

      .limit(limit)
      .offset((page - 1) * limit);
    try {
      const startTime = Date.now();
      const experts = await query.getMany();
      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Search completed in ${duration}ms. Found ${experts.length} experts.`,
      );

      return experts;
    } catch (error: any) {
      this.logger.error(
        `❌ Disaster executing PostGIS spatial query! Coordinates: [${latitude}, ${longitude}]`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );
      throw new BadRequestException(
        'Error processing spatial search for experts!',
      );
    }
  }
}
