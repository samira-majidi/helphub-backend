import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { CreatUserDto } from '#src/users/dtos/creat-user.dto';
import { SignInDto } from './dto/sing-in.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenProvider } from './providers/refresh-token.provider';
import { RefreshToken } from './dto/refresh-token.dto';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refershTokenProvider: RefreshTokenProvider,
  ) {}
  @UseInterceptors(ClassSerializerInterceptor)
  @Auth(AuthType.None)
  @Post('register')
  public registerUser(@Body() createUserDto: CreatUserDto) {
    return this.authService.registerUser(createUserDto);
  }

  @Auth(AuthType.None)
  @Post('register-specialist') // تغییر روت به متخصص
  public registerSpecialist(@Body() createUserDto: CreatUserDto) {
    return this.authService.registerSpecialist(createUserDto);
  }
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public singIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  public async refreshToken(@Body() refreshTokendto: RefreshToken) {
    return this.refershTokenProvider.refreshToken(refreshTokendto);
  }
}
