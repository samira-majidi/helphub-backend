import { Module } from '@nestjs/common';
import { OwnershipHandlerRegistry } from '#src/auth/authorization/ownership-handler.registry';
import { OwnershipService } from '#src/auth/authorization/ownership.service';

@Module({
  providers: [OwnershipHandlerRegistry, OwnershipService],
  exports: [OwnershipHandlerRegistry, OwnershipService],
})
export class OwnershipModule {}
