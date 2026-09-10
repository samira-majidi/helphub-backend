/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class WsCatchAllFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger('WebSocket-Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    this.logger.error(`🔥 socket erorr`);
    console.dir(exception, { depth: null, colors: true });

    const errorDetails =
      exception instanceof Error ? exception.message : exception;

    const responseError = exception?.response || errorDetails;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    client.emit('exception', {
      status: 'error',

      message: responseError,
    });
  }
}
