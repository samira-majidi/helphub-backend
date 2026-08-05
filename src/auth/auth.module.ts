import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { UsersModule } from '#src/users/users.module';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import { SignInProvider } from './providers/sing-in.provider';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt-config';
import { JwtModule } from '@nestjs/jwt';
import { GenerateTokenProviders } from './providers/generate-token.providers';
import { RefreshTokenProvider } from './providers/refresh-token.provider';
@Module({
  imports: [
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    SignInProvider,
    GenerateTokenProviders,
    RefreshTokenProvider,
  ],
  exports: [AuthService, HashingProvider, JwtModule],
})
export class AuthModule {}
