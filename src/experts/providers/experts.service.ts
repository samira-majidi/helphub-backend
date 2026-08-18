import {
  NotFoundException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as GeoJSON from 'geojson';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Expert } from '../entity/experts.entity';
import { User } from '#src/users/user.entity';
import { Category } from '../entity/categories.entity';
import { CreateExpertDto } from '../dto/create-expert.dto';
import { UpdateExpertDto } from '../dto/update-expert.dto';
import { UpdateExpertAvailabilityDto } from '../dto/update-expert-availability.dto'; // حتما مسیر دقیق این Dto را چک کن
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
    private readonly eventEmitter: EventEmitter2, // تزریق ایونت‌امیتر برای ارسال رویدادها 🚀
  ) {}
  async onModuleInit() {
    try {
      const count = await this.categoryRepository.count();

      // اگر جدول خالی بود، مقادیر رو از Enum می‌خونیم و ذخیره می‌کنیم
      if (count === 0) {
        this.logger.log(
          '🌱 دیتابیس خالیه! در حال ساخت دسته‌بندی‌های پیش‌فرض...',
        );

        const defaultCategories = Object.values(JobTitle).map((jobTitle) => ({
          name: jobTitle,
        }));

        await this.categoryRepository.save(defaultCategories);
        this.logger.log('✅ دسته‌بندی‌ها با موفقیت در دیتابیس ثبت شدند!');
      }
    } catch (error) {
      this.logger.error('❌ خطا در ساخت دسته‌بندی‌های پیش‌فرض', error);
    }
  }

  public async create(
    createExpertDto: CreateExpertDto,
    userId: number,
  ): Promise<Expert> {
    const { categoryId, imageIds, latitude, longitude, bio } = createExpertDto;

    // ۱. بررسی اینکه آیا کاربر از قبل پروفایل دارد یا خیر
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['expert'],
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد!');
    if (user.expert) {
      throw new BadRequestException('این کاربر از قبل پروفایل متخصص دارد!');
    }

    // ۲. بررسی وجود دسته‌بندی
    const categoryExists = await this.categoryRepository.existsBy({
      id: categoryId,
    });

    if (!categoryExists) {
      throw new NotFoundException(
        `دسته‌بندی شغلی با آیدی ${categoryId} یافت نشد.`,
      );
    }

    // ۳. استفاده از متد کمکی برای ساخت لوکیشن و اعتبارسنجی آن 🚀
    const location = this.updateLocation(undefined, latitude, longitude);

    // ۴. شروع تراکنش یکپارچه دیتابیس
    return await this.expertRepository.manager.transaction(async (manager) => {
      let avatar: Upload | undefined = undefined;

      // ۵. آپلود و اتصال عکس در صورت وجود
      if (imageIds && imageIds.length > 0) {
        const galleryImages = await this.galleryManager.attachGallery(
          imageIds,
          userId,
          {
            maxImages: 1, // فقط یک عکس برای پروفایل
            entityName: 'Expert',
          },
          manager,
        );

        if (galleryImages && galleryImages.length > 0) {
          avatar = galleryImages[0];
        }
      }

      // ۶. ساخت انتیتی جدید متخصص
      const expert = manager.create(Expert, {
        location,
        bio,
        user: { id: userId },
        category: { id: categoryId },
        avatar,
      });

      // ۷. ذخیره و لاگ
      const savedExpert = await manager.save(expert);
      this.logger.log(
        `Expert profile created successfully for User ID: ${userId} - Expert ID: ${savedExpert.id}`,
      );

      return savedExpert;
    });
  }

  public async update(
    updateExpertDto: UpdateExpertDto,
    userId: number,
  ): Promise<Expert> {
    const { categoryId, imageIds, latitude, longitude, bio } = updateExpertDto;

    // ۱. پیدا کردن پروفایل متخصص فقط بر اساس آیدی کاربر (توکن)
    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
      relations: ['avatar', 'category'],
    });

    if (!expert) {
      throw new NotFoundException('پروفایل متخصصی برای شما یافت نشد!');
    }
    if (bio !== undefined) {
      expert.bio = bio;
    }
    // ۲. بررسی وجود دسته‌بندی جدید در صورت ارسال
    if (categoryId) {
      const categoryExists = await this.categoryRepository.existsBy({
        id: categoryId,
      });

      if (!categoryExists) {
        throw new NotFoundException(
          `دسته‌بندی شغلی با آیدی ${categoryId} یافت نشد.`,
        );
      }
      expert.category = { id: categoryId } as Category;
    }

    // ۳. استفاده از متد کمکی برای آپدیت هوشمند و جزئی لوکیشن 🚀
    expert.location =
      this.updateLocation(expert.location, latitude, longitude) ??
      expert.location;

    // ۴. شروع تراکنش برای ذخیره تغییرات
    return await this.expertRepository.manager.transaction(async (manager) => {
      // ۵. مدیریت آپلود عکس جدید
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

      // ۶. ذخیره و لاگ
      const updatedExpert = await manager.save(Expert, expert);
      this.logger.log(
        `Expert profile updated successfully for User ID: ${userId} - Expert ID: ${updatedExpert.id}`,
      );

      return updatedExpert;
    });
  }

  public async remove(userId: number): Promise<void> {
    // ۱. بررسی وجود پروفایل بر اساس آیدی کاربر
    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!expert) {
      throw new NotFoundException('پروفایل متخصصی برای شما یافت نشد!');
    }

    // ۲. حذف در بستر تراکنش
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
        'latitude و longitude باید هر دو معتبر باشند.',
      );
    }

    // محدوده عرض و طول جغرافیایی کره زمین
    if (finalLat < -90 || finalLat > 90) {
      throw new BadRequestException('مقدار latitude باید بین -90 و 90 باشد.');
    }

    if (finalLng < -180 || finalLng > 180) {
      throw new BadRequestException(
        'مقدار longitude باید بین -180 و 180 باشد.',
      );
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

    // ۱. فقط آیدی متخصص رو میگیریم که سبک باشه (برای رویداد نیاز داریم)
    const expert = await this.expertRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'], // فقط آیدی رو بیار، بقیه رو ول کن! 🪶
    });

    if (!expert) {
      throw new NotFoundException('پروفایل متخصصی برای شما یافت نشد!');
    }

    // ۲. آپدیت مستقیم و نقطه‌ای در دیتابیس (بدون درگیری با بقیه فیلدها) ⚡
    await this.expertRepository.update(
      { id: expert.id },
      { availabilityStatus },
    );

    // ۳. لاگ کردن
    this.logger.log(
      `وضعیت متخصص ${expert.id} (User ID: ${userId}) با موفقیت به ${availabilityStatus} تغییر یافت.`,
    );

    // ۴. خبر کردن بقیه سیستم (نقشه، سوکت و...) 🚀
    this.eventEmitter.emit('expert.status.updated', {
      expertId: expert.id,
      userId: userId,
      status: availabilityStatus,
    });

    // برگرداندن دیتای سبک به کلاینت
    return {
      id: expert.id,
      availabilityStatus,
    };
  }
  public async getCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        select: ['id', 'name'], // We only need id and name for the frontend dropdown
        order: {
          id: 'ASC', // Optional: order them predictably
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
      // اینجا ریلیشن‌ها رو میاریم که دیتای دسته‌بندی و عکس هم همراهش بیاد
      relations: ['category', 'avatar', 'user'],
    });

    if (!expert) {
      throw new NotFoundException(
        'پروفایل متخصصی برای شما یافت نشد! اول باید پروفایلت رو بسازی. 🛠️',
      );
    }

    this.logger.log(`پروفایل متخصص برای کاربر ${userId} با موفقیت واکشی شد.`);

    return expert;
  }
}
