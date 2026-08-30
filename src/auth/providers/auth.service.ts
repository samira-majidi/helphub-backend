// auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserRole } from '#src/common/enum/user-role.enum';
import { CreatUserDto } from '#src/users/dtos/creat-user.dto';
import { UserService } from '#src/users/providers/user-service';
import { SignInDto } from '../dto/sing-in.dto';
import { SignInProvider } from './sing-in.provider';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly signInProvider: SignInProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async registerUser(dto: CreatUserDto) {
    const user = await this.usersService.createUser(dto, UserRole.USER);

    const tokens = await this.signInProvider.signIn({
      email: dto.email,
      password: dto.password,
    });

    // ۳. بازگرداندن کاربر و توکن‌ها
    return {
      user,
      ...tokens,
    };
  }

  public async registerSpecialist(dto: CreatUserDto) {
    const user = await this.usersService.createUser(dto, UserRole.SPECIALIST);

    this.eventEmitter.emit('specialist.registered', user);

    const tokens = await this.signInProvider.signIn({
      email: dto.email,
      password: dto.password,
    });

    return { user, ...tokens };
  }

  public async signIn(signInDto: SignInDto) {
    return this.signInProvider.signIn(signInDto);
  }
}
