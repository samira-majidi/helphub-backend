import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Permission } from '../enums/permission.enum';
import { PERMISSIONS_KEY } from '../constants/permission-constant';
import { Request } from 'express';
import { REQUEST_USER_KEY } from '#src/auth/constants/auth-constant';
import { UserRole } from '../enums/role.enum';
import { RolePermissions } from '../mapping/role-permission.map';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requierdPermission =
      this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getHandler()) ??
      [];

    if (!requierdPermission || requierdPermission.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const user = request[REQUEST_USER_KEY] as JwtPayload;
    if (!user) {
      throw new UnauthorizedException('user not logged in');
    }
    const userRole = user.role as UserRole;

    if (!userRole) {
      throw new ForbiddenException('role missing in jwt');
    }
    //استخراج تمام مجوزهایی که یوزر داره
    const permissionS = RolePermissions[userRole];

    if (!permissionS) {
      throw new ForbiddenException(`Role '${userRole}' has no permissions`);
    }

    const hasAll = requierdPermission.every((p) => permissionS.includes(p));

    if (!hasAll) {
      throw new ForbiddenException('there is no pemission set for your id');
    }

    return true;
  }
}
