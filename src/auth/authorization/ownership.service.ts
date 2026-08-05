import { Injectable, ForbiddenException } from '@nestjs/common';
import { OwnershipHandlerRegistry } from './ownership-handler.registry';

@Injectable()
export class OwnershipService {
  constructor(private registry: OwnershipHandlerRegistry) {}

  async checkOwnership(
    entity: string,
    entityId: string | number,
    userId: number,
  ): Promise<boolean> {
    const handler = this.registry.get(entity);

    if (!handler) {
      throw new ForbiddenException(
        `No ownership handler registered for entity '${entity}'`,
      );
    }

    return await handler(entityId, userId);
  }
}
