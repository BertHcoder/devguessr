import { io, type Socket } from 'socket.io-client';

// In production the client is served by the game server itself, so connect to
// the same origin. Override with VITE_SERVER_URL for split deployments.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : '');

const options = {
  autoConnect: true,
  transports: ['websocket', 'polling'],
};

export const socket: Socket = SERVER_URL ? io(SERVER_URL, options) : io(options);
