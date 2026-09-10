import {
  NotFoundException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as GeoJSON from 'geojson';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { Expert } from '../entity/experts.entity';
import { User } from '#src/users/user.entity';
import { Category } from '../entity/categories.entity';
import { CreateExpertDto } from '../dto/create-expert.dto';
import { UpdateExpertDto } from '../dto/update-expert.dto';
import { UpdateExpertAvailabilityDto } from '../dto/update-expert-availability.dto';
import { Upload } from '#src/common/upload/entity/upload.entity';
import { GalleryManagerService } from '#src/common/upload/providers/gallery-manager.service';
import { JobTitle } from '../enum/job-title.enum';

@Injectable()
export class ExpertsService {
  private readonly logger = new Logger(ExpertsService.name);

  constructor(
    @InjectRepository(Expert)
    private readonly expertRepository: Repository<Expert>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly galleryManager: GalleryManagerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async onModuleInit() {
    try {
      const count = await this.categoryRepository.count();

      if (count === 0) {
        this.logger.log('🌱 Database is empty! Seeding default categories...');

        const defaultCategories = Object.values(JobTitle).map((jobTitle) => ({
          name: jobTitle,
        }));

        await this.categoryRepository.save(defaultCategories);
        this.logger.log(
          '✅ Default categories successfully seeded into database!',
        );
      }
    } catch (error) {
      this.logger.error('❌ Error seeding default categories', error);
    }
  }

  public async create(
    createExpertDto: CreateExpertDto,
    userId: number,
  ): Promise<Expert> {
    const { categoryId, imageIds, latitude, longitude, bio } = createExpertDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['expert'],
    });

    if (!user) throw new NotFoundException('User not found!');
    if (user.expert) {
      throw new BadRequestException('This user already has an expert profile!');
    }

    const categoryExists = await this.categoryRepository.existsBy({
      id: categoryId,
    });

    if (!categoryExists) {
      throw new NotFoundException(
        `Job category with ID ${categoryId} not found.`,
      );
    }

    const location = this.updateLocation(undefined, latitude, longitude);

    return await this.expertRepository.manager.transaction(async (manager) => {
      let avatar: Upload | undefined = undefined;

      if (imageIds && imageIds.length > 0) {
        const galleryImages = await this.galleryManager.attachGallery(
          imageIds,
          userId,
          {
            maxImages: 1,
            entityName: 'Expert',
          },
          manager,
        );

        if (galleryImages && galleryImages.length > 0) {
          avatar = galleryImages[0];
        }
      }

      const expert = manager.create(Expert, {
        location,
        bio,
        user: { id: userId },
        category: { id: categoryId },
        avatar,
      });

      const savedExpert = await manager.save(expert);
      this.logger.log(
        `Expert profile created successfully for User ID: ${userId} - Expert ID: ${savedExpert.id}`,
      );

      return savedExpert;
    });
  }
  @OnEvent('specialist.registered')
  async handleSpecialistRegisteredEvent(user: User) {
    try {
      this.logger.log(
        `📥 Registration event received for user: ${user.email} (ID: ${user.id})`,
      );

      const expertProfile = this.expertRepository.create({
        user: { id: user.id },
      });

      const savedProfile = await this.expertRepository.save(expertProfile);

      this.logger.log(
        `🎉 Initial expert profile successfully created! [User ID: ${user.id} | Expert ID: ${savedProfile.id}]`,
      );
    } catch (error: any) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `❌ Error automatically creating expert profile for user ${user?.id}: ${error.message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );
    }
  }
  public async update(
    updateExpertDto: UpdateExpertDto,
    userId: number,
  ): Promise<Expert> {
    const { categoryId, imageIds, latitude, longitude, bio } = updateExpertDto;

    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
      relations: ['avatar', 'category'],
    });

    if (!expert) {
      throw new NotFoundException('Expert profile not found for this user!');
    }
    if (bio !== undefined) {
      expert.bio = bio;
    }

    if (categoryId) {
      const categoryExists = await this.categoryRepository.existsBy({
        id: categoryId,
      });

      if (!categoryExists) {
        throw new NotFoundException(
          `Job category with ID ${categoryId} not found.`,
        );
      }
      expert.category = { id: categoryId } as Category;
    }

    expert.location =
      this.updateLocation(expert.location, latitude, longitude) ??
      expert.location;

    return await this.expertRepository.manager.transaction(async (manager) => {
      if (imageIds && imageIds.length > 0) {
        const galleryImages = await this.galleryManager.attachGallery(
          imageIds,
          userId,
          {
            maxImages: 1,
            entityName: 'Expert',
          },
          manager,
        );

        if (galleryImages && galleryImages.length > 0) {
          expert.avatar = galleryImages[0];
        }
      }

      const updatedExpert = await manager.save(Expert, expert);
      this.logger.log(
        `Expert profile updated successfully for User ID: ${userId} - Expert ID: ${updatedExpert.id}`,
      );

      return updatedExpert;
    });
  }

  public async remove(userId: number): Promise<void> {
    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!expert) {
      throw new NotFoundException('Expert profile not found for this user!');
    }

    await this.expertRepository.manager.transaction(async (manager) => {
      await manager.remove(Expert, expert);

      this.logger.log(
        `Expert profile deleted successfully for User ID: ${userId} - Expert ID: ${expert.id}`,
      );
    });
  }

  public updateLocation(
    currentLocation?: GeoJSON.Point | null,
    latitude?: number,
    longitude?: number,
  ): GeoJSON.Point | undefined {
    if (latitude == null && longitude == null) {
      return currentLocation ?? undefined;
    }

    const currentLng = currentLocation?.coordinates?.[0];
    const currentLat = currentLocation?.coordinates?.[1];

    const finalLng = longitude ?? currentLng;
    const finalLat = latitude ?? currentLat;

    if (finalLat == null || finalLng == null) {
      throw new BadRequestException(
        'Both latitude and longitude must be valid.',
      );
    }

    if (finalLat < -90 || finalLat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90.');
    }

    if (finalLng < -180 || finalLng > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180.');
    }

    return {
      type: 'Point',
      coordinates: [finalLng, finalLat],
    };
  }

  public async updateAvailabilityStatus(
    userId: number,
    updateExpertAvailabilityDto: UpdateExpertAvailabilityDto,
  ) {
    const { availabilityStatus } = updateExpertAvailabilityDto;

    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!expert) {
      throw new NotFoundException('Expert profile not found for this user!');
    }

    await this.expertRepository.update(
      { id: expert.id },
      { availabilityStatus },
    );

    this.logger.log(
      `Status for expert ${expert.id} (User ID: ${userId}) was successfully updated to ${availabilityStatus}.`,
    );

    this.eventEmitter.emit('expert.status.updated', {
      expertId: expert.id,
      userId: userId,
      status: availabilityStatus,
    });

    return {
      id: expert.id,
      availabilityStatus,
    };
  }
  public async getCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        select: ['id', 'name'],
        order: {
          id: 'ASC',
        },
      });

      return categories;
    } catch (error) {
      this.logger.error('Failed to fetch categories', error);
      throw new BadRequestException('Could not fetch categories');
    }
  }
  public async getProfile(userId: number): Promise<Expert> {
    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },

      relations: ['category', 'avatar', 'user'],
    });

    if (!expert) {
      throw new NotFoundException(
        'Expert profile not found! You need to create your profile first. 🛠️',
      );
    }

    this.logger.log(`Expert profile for user ${userId} fetched successfully.`);

    return expert;
  }
  public async getExpertById(expertId: string): Promise<Expert> {
    const expert = await this.expertRepository.findOne({
      where: { id: expertId },
      relations: ['category', 'avatar', 'user'],
    });

    if (!expert) {
      throw new NotFoundException(`Expert with ID ${expertId} not found! 🕵️‍♂️`);
    }

    this.logger.log(`Expert profile with ID ${expertId} fetched successfully.`);

    return expert;
  }
}
