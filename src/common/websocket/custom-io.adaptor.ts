import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const globalOptions = {
      ...options,
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
    };

    return super.createIOServer(port, globalOptions);
  }
}
