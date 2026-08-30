import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserProvider } from './create-user.provider';
import { CreatUserDto } from '../dtos/creat-user.dto';
import { UserRole } from '#src/common/enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly createUserProvider: CreateUserProvider,
  ) {}

  public async createUser(creatUserDto: CreatUserDto, role: UserRole) {
    try {
      // استفاده از await برای شکار خطا در catch الزامی است
      return await this.createUserProvider.createUser(creatUserDto, role);
    } catch (error: unknown) {
      // تعریف تایپ موقت برای خواندن پراپرتی code
      const err = error as { code?: string };

      if (err.code === '23505') {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException(
        'Something went wrong during registration',
      );
    }
  }

  public async findOwnerById(id: number): Promise<User> {
    const owner = await this.userRepository.findOneBy({ id });

    if (!owner) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return owner;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      return existingUser;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
      );
    }
  }
  public async getUserProfileById(userId: number) {
    // گرفتن یوزر به همراه پروفایل متخصص و جدول آپلود (فقط برای متخصص)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'expert', // گرفتن اطلاعات پایه متخصص
        'expert.avatar', // Join با جدول Upload برای گرفتن عکس متخصص
        'expert.category', // Join با جدول دسته‌بندی
      ],
    });

    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد!');
    }

    // تشخیص اینکه کاربر متخصص هست یا نه
    const isSpecialist = !!user.expert;

    return {
      id: user.id,
      email: user.email,
      role: user.role,

      // --- فیلدهای مشترک و پایه ---
      // طبق انتیتی شما اسم این فیلد name هست نه firstName
      name: user.name,
      lastName: user.lastName,

      // --- مدیریت هوشمند آواتار ---
      // ⚠️ توجه: کلمه `path` در خط زیر رو با فیلد درست در Upload Entity خودت (مثل filename یا fileUrl) عوض کن
      avatarUrl:
        isSpecialist && user.expert?.avatar ? user.expert.avatar.path : null, // چون کاربر عادی آواتار نداره، برای کاربران عادی null برمی‌گرده

      // --- فیلدهای مخصوص متخصص (اگر کاربر عادی باشه همگی null میشن) ---
      bio: isSpecialist ? user.expert.bio : null,
      rating: isSpecialist ? Number(user.expert.rating) : null,
      availabilityStatus: isSpecialist ? user.expert.availabilityStatus : null,
      location: isSpecialist ? user.expert.location : null,

      // فقط در صورتی که متخصص باشه و دسته‌بندی داشته باشه برمی‌گردونه
      category:
        isSpecialist && user.expert.category
          ? {
              id: user.expert.category.id,
              // name: user.expert.category.name
            }
          : null,
    };
  }
}
