import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpertsController } from './controller/experts.controller';
import { ExpertsService } from './providers/experts.service';
import { ExpertsGateway } from './gateway/expert-status.gateway';

import { Expert } from './entity/experts.entity';
import { Category } from './entity/categories.entity';
import { User } from '#src/users/user.entity';
import { UploadModule } from '#src/common/upload/upload.module';
import { CategoriesController } from './controller/categories.controller';
import { AuthModule } from '#src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expert, Category, User]),
    UploadModule,
    AuthModule,
  ],
  controllers: [ExpertsController, CategoriesController],
  providers: [ExpertsService, ExpertsGateway],
  exports: [ExpertsService],
})
export class ExpertsModule {}
