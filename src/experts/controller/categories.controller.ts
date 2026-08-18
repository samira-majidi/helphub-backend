import { Controller, Get } from '@nestjs/common';
import { ExpertsService } from '../providers/experts.service';
import { Auth } from '#src/auth/decorators/auth.decorator';
import { AuthType } from '#src/auth/enums/auth-type.enum';
@Controller('categories')
export class CategoriesController {
  constructor(private readonly expertsService: ExpertsService) {}
  @Auth(AuthType.None)
  @Get()
  async getAllCategories() {
    return await this.expertsService.getCategories();
  }
}
