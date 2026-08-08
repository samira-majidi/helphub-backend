/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class WsCatchAllFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger('WebSocket-Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    // چاپ دقیق و کامل خطا در ترمینال NestJS
    this.logger.error(`🔥 خطای سوکت رخ داد!`);
    console.dir(exception, { depth: null, colors: true });

    // استخراج پیام خطا برای ارسال درست به فرانت‌اند
    const errorDetails =
      exception instanceof Error ? exception.message : exception;

    const responseError = exception?.response || errorDetails;

    // ارسال دستی و تمیز خطا به فرانت‌اند (تا دیگه {} نگیریم)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    client.emit('exception', {
      status: 'error',

      message: responseError,
    });
  }
}
