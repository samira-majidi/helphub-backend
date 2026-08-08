import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    // تایپ صریح رو از اینجا حذف کردیم
    const globalOptions = {
      ...options,
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
    };

    // با استفاده از as ServerOptions یا as any مشکل ناسازگاری تایپ حل میشه
    return super.createIOServer(port, globalOptions);
  }
}
