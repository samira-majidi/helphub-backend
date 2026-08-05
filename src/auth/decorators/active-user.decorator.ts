import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { ActiveUserData } from '../interfaces/active-user.interface';
import { REQUEST_USER_KEY } from '../constants/auth-constant';

// تعریف نوع Socket اختصاصی با فیلد دیتای تایپ‌شده
export interface AuthenticatedSocket extends Socket {
  data: {
    user?: ActiveUserData;
  };
}

// تعریف نوع Request اختصاصی برای کانتکست HTTP
export interface AuthenticatedRequest extends Request {
  [REQUEST_USER_KEY]?: ActiveUserData;
}

export const ActiveUser = createParamDecorator(
  (
    field: keyof ActiveUserData | undefined,
    ctx: ExecutionContext,
  ): ActiveUserData | ActiveUserData[keyof ActiveUserData] | undefined => {
    let user: ActiveUserData | undefined;

    // ۱. بررسی کانتکست وب‌سوکت
    if (ctx.getType() === 'ws') {
      const client = ctx.switchToWs().getClient<AuthenticatedSocket>();
      user = client.data?.user;
    }
    // ۲. بررسی کانتکست HTTP
    else {
      const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
      user = request[REQUEST_USER_KEY];
    }

    if (!user) {
      return undefined;
    }

    return field ? user[field] : user;
  },
);
