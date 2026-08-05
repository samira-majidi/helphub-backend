import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_META = 'ownership_meta';

export interface OwnershipMeta {
  entity: string;
  param: string; // name of route param
}

export const CheckOwnership = (entity: string, param: string) =>
  SetMetadata(OWNERSHIP_META, { entity, param });
