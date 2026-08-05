import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './providers/user-service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserProvider } from './providers/create-user.provider';
import { AuthModule } from '#src/auth/auth.module';
@Module({
  controllers: [UsersController],
  providers: [UserService, CreateUserProvider],
  exports: [UserService],
  //this line of code will made the repository for user
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
})
export class UsersModule {}
