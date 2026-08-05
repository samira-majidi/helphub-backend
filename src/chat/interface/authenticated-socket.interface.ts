import { Socket } from 'socket.io';
import { ActiveUserData } from '#src/auth/interfaces/active-user.interface';

export interface ClientToServerEvents {
  joinTaskRoom: (payload: { roomId: string }) => void;
  sendMessage: (payload: { roomId: string; content: string }) => void;
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
>;
