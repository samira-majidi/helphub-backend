import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
  abstract hashingPassword(data: string): Promise<string>;
  abstract comparePassword(data: string, encrypted: string): Promise<boolean>;
}
