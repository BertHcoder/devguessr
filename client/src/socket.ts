import type {
  GameOverPayload, PlayerProfile, PublicRoom, RoomSettings, RoundResultPayload, RoundStartPayload,
} from './types';

interface AckResponse {
  ok: boolean;
  code?: string;
  playerId?: string;
  error?: string;
  type?: string;
  hiddenIndices?: number[];
  newEndsAt?: number;
  optionCounts?: number[];
}

interface ClientEvents {
  'room:create': { name: string; profile?: Partial<PlayerProfile>; settings?: Partial<RoomSettings> };
  'room:join': { code: string; name: string; profile?: Partial<PlayerProfile> };
  'room:leave': undefined;
  'room:settings': Partial<RoomSettings>;
  'profile:update': Partial<PlayerProfile>;
  'game:start': undefined;
  'game:restart': undefined;
  'answer:submit': { choice: number };
  'powerup:use': { type: string };
}

interface ServerEvents {
  connect: undefined;
  disconnect: undefined;
  error: { message: string };
  'room:update': PublicRoom;
  'round:start': RoundStartPayload;
  'round:result': RoundResultPayload;
  'game:over': GameOverPayload;
  'powerup:smoked': { fromName: string; durationMs: number };
  'round:timeExtended': { endsAt: number };
}

class GameSocket {
  connected = false;
  id: string | undefined;
  private ws: WebSocket | null = null;
  private nextRequestId = 0;
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private pendingPingAt = 0;
  private lastHeartbeatAt = 0;
  private listeners = new Map<keyof ServerEvents, Map<unknown, (data: unknown) => void>>();
  private pending = new Map<number, {
    callback: (response: AckResponse) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  constructor() {
    void this.checkHealth();
  }

  on<E extends keyof ServerEvents>(event: E, callback: (data: ServerEvents[E]) => void): void {
    let handlers = this.listeners.get(event);
    if (!handlers) this.listeners.set(event, handlers = new Map());
    handlers.set(callback, (data) => callback(data as ServerEvents[E]));
  }

  off<E extends keyof ServerEvents>(event: E, callback: (data: ServerEvents[E]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private dispatch(event: keyof ServerEvents, data?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  private async checkHealth(): Promise<void> {
    try {
      const response = await fetch('/health', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok || (await response.json()).ok !== true) throw new Error('Game server unavailable.');
      this.connected = true;
      this.dispatch('connect');
    } catch (error) {
      console.error('Game server connection failed', error);
      this.connected = false;
      this.dispatch('disconnect');
      setTimeout(() => void this.checkHealth(), 3000);
    }
  }

  emit<E extends keyof ClientEvents>(
    event: E, data?: ClientEvents[E], callback?: (response: AckResponse) => void,
  ): void {
    if (event === 'room:leave') {
      this.closeRoom();
      return;
    }
    const requestId = ++this.nextRequestId;
    const ack = callback ?? ((response: AckResponse) => {
      if (!response.ok) this.dispatch('error', { message: response.error ?? 'Game request failed.' });
    });
    this.pending.set(requestId, {
      callback: ack,
      timer: setTimeout(() => {
        this.acknowledge(requestId, { ok: false, error: 'Game server timed out. Please try again.' });
        // Never leave a player in a room after an unacknowledged create/join.
        if (event === 'room:create' || event === 'room:join') this.connectionLost();
      }, 10000),
    });
    const message = JSON.stringify({ event, data, requestId });
    if (event === 'room:create' || event === 'room:join') {
      if (this.ws) {
        this.acknowledge(requestId, { ok: false, error: 'Leave the current room first.' });
        return;
      }
      const code = event === 'room:create' ? 'new' : (data as ClientEvents['room:join']).code;
      const url = new URL(`/api/rooms/${encodeURIComponent(code)}`, location.href);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        ws.send(message);
        this.pendingPingAt = 0;
        this.lastHeartbeatAt = Date.now();
        this.heartbeat = setInterval(() => {
          const now = Date.now();
          // Background tabs and sleeping devices can suspend timers. Probe again on wake.
          if (now - this.lastHeartbeatAt > 30000) this.pendingPingAt = 0;
          this.lastHeartbeatAt = now;
          if (this.pendingPingAt && now - this.pendingPingAt > 45000) {
            this.connectionLost();
          } else if (!this.pendingPingAt && ws.readyState === WebSocket.OPEN) {
            this.pendingPingAt = now;
            ws.send('ping');
          }
        }, 15000);
      };
      ws.onmessage = ({ data: raw }: MessageEvent<string>) => {
        if (raw === 'pong') {
          this.pendingPingAt = 0;
          return;
        }
        let envelope: { event: string; data: unknown; requestId?: number };
        try {
          envelope = JSON.parse(raw);
          if (!envelope || typeof envelope.event !== 'string') throw new Error('Invalid server message.');
        } catch (error) {
          console.error('Invalid game server response', error);
          this.connectionLost();
          return;
        }
        if (envelope.event === 'session') {
          this.id = (envelope.data as { playerId: string }).playerId;
          this.dispatch('connect');
        } else if (envelope.event === 'ack' && envelope.requestId !== undefined) {
          const response = envelope.data as AckResponse;
          this.acknowledge(envelope.requestId, response);
          if (!response.ok && !this.id) this.closeRoom();
        } else {
          this.dispatch(envelope.event as keyof ServerEvents, envelope.data);
        }
      };
      ws.onerror = () => this.dispatch('error', { message: 'Could not connect to the game room.' });
      ws.onclose = () => this.connectionLost();
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.acknowledge(requestId, { ok: false, error: 'Not connected to a room.' });
    }
  }

  private acknowledge(requestId: number, response: AckResponse): void {
    const pending = this.pending.get(requestId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(requestId);
    pending.callback(response);
  }

  private closeRoom(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.close(1000, 'Left room.');
      this.ws = null;
    }
    clearInterval(this.heartbeat);
    this.id = undefined;
    for (const requestId of this.pending.keys()) {
      this.acknowledge(requestId, { ok: false, error: 'Connection closed. Please try again.' });
    }
  }

  private connectionLost(): void {
    this.closeRoom();
    this.connected = false;
    this.dispatch('disconnect');
    this.dispatch('error', { message: 'Connection lost. Rejoin the room, or create a new one if the game started.' });
    void this.checkHealth();
  }
}

export const socket = new GameSocket();
