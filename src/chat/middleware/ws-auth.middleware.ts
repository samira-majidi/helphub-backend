import { JwtService } from '@nestjs/jwt';
import { ActiveUserData } from '#src/auth/interfaces/active-user.interface';
// مسیر این فایل رو بر اساس ساختار پوشه‌های پروژه‌ت تنظیم کن
import { AuthenticatedSocket } from '../interface/authenticated-socket.interface';

type SocketAuthPayload = {
  token?: unknown;
};

export type SocketIOMiddleware = (
  client: AuthenticatedSocket,
  next: (err?: Error) => void,
) => void;

export const WsAuthMiddleware = (
  jwtService: JwtService,
): SocketIOMiddleware => {
  return (client, next) => {
    const authenticate = async (): Promise<void> => {
      try {
        const auth = client.handshake.auth as SocketAuthPayload | undefined;
        const token = auth?.token;

        if (typeof token !== 'string' || token.trim().length === 0) {
          next(new Error('Authentication error: No valid token provided'));
          return;
        }

        const payload = await jwtService.verifyAsync<ActiveUserData>(token);

        // اینجا چون AuthenticatedSocket رو پاس دادیم،
        // تایپ‌اسکریپت دقیقاً می‌دونه client.data شامل user هست.
        client.data = { user: payload };

        next();
      } catch {
        next(new Error('Authentication error: Invalid or expired token'));
      }
    };

    void authenticate();
  };
};
