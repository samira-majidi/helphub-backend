import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { OwnershipService } from '#src/auth/authorization/ownership.service';
import { Socket } from 'socket.io';
import { ActiveUserData } from '#src/auth/interfaces/active-user.interface';

// ۱. اینترفیس دیتای سوکت
interface WsPayload {
  roomId?: string | number;
}

@Injectable()
export class WsOwnershipGuard implements CanActivate {
  constructor(private readonly ownership: OwnershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>();

    // ۲. کست کردن دیتای دریافتی برای جلوگیری از خطای any
    const data = wsContext.getData<WsPayload>();

    // ۳. استفاده از ActiveUserData برای جلوگیری از any در client.data
    const clientData = client.data as { user?: ActiveUserData };
    const userId = clientData?.user?.sub;

    if (!userId) {
      throw new WsException('User not authenticated.');
    }

    const entityIdRaw = data?.roomId;

    if (entityIdRaw == null) {
      throw new WsException('Invalid room or task ID.');
    }

    // ۴. تبدیل و اعتبارسنجی ID
    const entityId =
      typeof entityIdRaw === 'string' && /^\d+$/.test(entityIdRaw)
        ? Number(entityIdRaw)
        : entityIdRaw;

    if (typeof entityId === 'number' && Number.isNaN(entityId)) {
      throw new WsException('Invalid room or task ID.');
    }

    const has = await this.ownership.checkOwnership('task', entityId, userId);

    if (!has) {
      throw new WsException('You are not owner of this resource.');
    }

    return true;
  }
}
