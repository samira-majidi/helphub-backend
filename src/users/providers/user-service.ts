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
}
