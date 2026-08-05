import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreatUserDto } from '../dtos/creat-user.dto';
import { User } from '../user.entity';
import { UserRole } from '#src/common/enum/user-role.enum';
import { Repository } from 'typeorm';
import { HashingProvider } from '#src/auth/providers/hashing.provider';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CreateUserProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProviders: HashingProvider,
  ) {}

  public async createUser(creatUserDto: CreatUserDto, role: UserRole) {
    const normalizedEmail = creatUserDto.email.toLowerCase();

    const user = this.userRepository.create({
      ...creatUserDto,
      email: normalizedEmail,
      role,
      password: await this.hashingProviders.hashingPassword(
        creatUserDto.password,
      ),
    });

    return this.userRepository.save(user);
  }
}
