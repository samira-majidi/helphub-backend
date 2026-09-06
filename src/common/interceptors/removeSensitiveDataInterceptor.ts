import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class RemoveSensitiveDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(map((data: unknown) => this.removeSensitiveFields(data)));
  }

  private removeSensitiveFields(data: unknown): unknown {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.removeSensitiveFields(item));
    }

    const result: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
    };

    delete result.password;

    for (const key of Object.keys(result)) {
      const value = result[key];

      if (value !== null && typeof value === 'object') {
        result[key] = this.removeSensitiveFields(value);
      }
    }

    return result;
  }
}
