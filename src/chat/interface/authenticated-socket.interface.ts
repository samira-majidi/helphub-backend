import { Socket } from 'socket.io';
import { ActiveUserData } from '#src/auth/interfaces/active-user.interface';
import { NotificationType } from '#src/notification/type/notificationType';

export interface ClientToServerEvents {
  joinTaskRoom: (payload: { roomId: string }) => void;
  sendMessage: (payload: { roomId: string; content: string }) => void;

  typing: (payload: { roomId: string; isTyping: boolean }) => void;
}

export interface ServerToClientEvents {
  newMessage: (payload: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  }) => void;
  joinedRoom: (payload: { roomId: string; message: string }) => void;
  error: (payload: { message: string }) => void;

  userTyping: (payload: { isTyping: boolean }) => void;
  newNotification: (payload: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    createdAt: Date;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user?: ActiveUserData;
}

export type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> & {
  user?: ActiveUserData;
};
