import { Injectable } from '@nestjs/common';
// اینجا یک مرکز ثبت است
// این کلاس وظیفه نگهداری توابع مالکیت هر ماژول را دارد تا گارد بتواند از آن‌ها استفاده کند.
type OwnershipHandler = (
  entityId: string | number,
  userId: number,
) => Promise<boolean>;

@Injectable()
export class OwnershipHandlerRegistry {
  private handlers = new Map<string, OwnershipHandler>();

  register(entity: string, handler: OwnershipHandler) {
    if (this.handlers.has(entity)) {
      throw new Error(`Ownership handler for '${entity}' already registered`);
    }

    this.handlers.set(entity, handler);
  }

  get(entity: string): OwnershipHandler | undefined {
    return this.handlers.get(entity);
  }
}
