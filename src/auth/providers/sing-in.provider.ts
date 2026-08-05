import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '#src/users/providers/user-service';
import { SignInDto } from '../dto/sing-in.dto';
import { HashingProvider } from './hashing.provider';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt-config';
import { GenerateTokenProviders } from './generate-token.providers';
/** Handles user authentication and issues JWT access tokens. */
@Injectable()
export class SignInProvider {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
    private readonly hashingProvider: HashingProvider,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly generateTokenProvider: GenerateTokenProviders,
  ) {}
  /** Validates credentials and returns a signed JWT access token. */
  public async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findUserByEmail(signInDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isEqual = await this.hashingProvider.comparePassword(
      signInDto.password,
      user.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.generateTokenProvider.generateToken(user);
  }
}
