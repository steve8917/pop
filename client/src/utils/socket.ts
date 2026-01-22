import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';

type CreateSocketOptions = Partial<ManagerOptions & SocketOptions>;

function getSocketBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim().length > 0) {
    return String(fromEnv).replace(/\/$/, '');
  }

  // In dev il backend gira tipicamente su 5001.
  if (import.meta.env.DEV) {
    return 'http://localhost:5001';
  }

  // In produzione, se client e server sono sullo stesso dominio,
  // Socket.IO funziona usando l'origin corrente.
  return window.location.origin;
}

export function createAppSocket(options: CreateSocketOptions = {}): Socket {
  return io(getSocketBaseUrl(), {
    withCredentials: true,
    ...options
  });
}
