import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CreatUserDto } from './dtos/creat-user.dto';
import { UserService } from './providers/user-service';
import { UserRole } from '#src/common/enum/user-role.enum';
import { Auth } from '#src/auth/decorators/auth.decorator';
import { AuthType } from '#src/auth/enums/auth-type.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Auth(AuthType.None)
  public postusers(@Body() creatUserDto: CreatUserDto, role: UserRole) {
    return this.userService.createUser(creatUserDto, role);
  }
  @Get('profile/:id')
  @Auth(AuthType.None)
  public async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserProfileById(id);
  }
}
