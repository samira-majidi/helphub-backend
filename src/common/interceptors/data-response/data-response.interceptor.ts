import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { map, Observable, tap } from 'rxjs';

interface MetaData {
  timestamp: string;
  path: string;
  version: string;
}

@Injectable()
export class DataResponseInterceptor<T> implements NestInterceptor<
  T,
  { data: T; meta: MetaData }
> {
  private readonly logger = new Logger('HTTP_TRAFFIC');

  constructor(private readonly configService: ConfigService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ data: T; meta: MetaData }> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`[${method}] ${url} - ${duration}ms`);
      }),

      map((data: T) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: url,
          version: this.configService.get('APP_VERSION', '1.0.0'),
        },
      })),
    );
  }
}
