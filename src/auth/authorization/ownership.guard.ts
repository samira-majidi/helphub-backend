import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { OWNERSHIP_META } from './ownership.decorator';
import { OwnershipService } from './ownership.service';
import { OwnershipMeta } from './interface/ownershipmeta.interface';
import { TypedRequest } from './interface/type-request';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownership: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<OwnershipMeta>(
      OWNERSHIP_META,
      context.getHandler(),
    );

    if (!meta) return true;

    const req = context.switchToHttp().getRequest<TypedRequest>();

    const userId = req.user?.sub;
    const entityIdRaw = req.params[meta.param];
    const entityId = /^\d+$/.test(entityIdRaw)
      ? Number(entityIdRaw)
      : entityIdRaw;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated.');
    }

    if (entityIdRaw == null || Number.isNaN(entityId)) {
      throw new BadRequestException('Invalid entity id.');
    }

    const has = await this.ownership.checkOwnership(
      meta.entity,
      entityId,
      userId,
    );

    if (!has) {
      throw new ForbiddenException('You are not owner of this resource.');
    }

    return true;
  }
}
