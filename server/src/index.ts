import { DurableObject } from 'cloudflare:workers';
import {
  addPlayer, allAnswered, applySettings, beginRound, createRoom, currentQuestion,
  leaderboard, makeCode, removePlayer, startGame, submitAnswer, toPublicQuestion,
  toPublicRoom, updatePlayerProfile, usePowerup, type PowerupType,
} from './rooms.js';
import type { Category, PlayerProfile, Room, RoomSettings } from './types.js';

class InputError extends Error {}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputError('Invalid message.');
  }
  return value as Record<string, unknown>;
}

function profile(value: unknown): Partial<PlayerProfile> | undefined {
  if (value === undefined) return undefined;
  const data = record(value);
  const result: Partial<PlayerProfile> = {};
  for (const key of ['name', 'avatar', 'favTech', 'color', 'tagline'] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== 'string') throw new InputError('Invalid profile.');
    result[key] = data[key];
  }
  return result;
}

function settings(value: unknown): Partial<RoomSettings> {
  const data = record(value);
  const result: Partial<RoomSettings> = {};
  for (const key of ['rounds', 'roundTime'] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== 'number' || !Number.isFinite(data[key])) {
      throw new InputError('Invalid room settings.');
    }
    result[key] = data[key];
  }
  for (const key of ['progressiveReveal', 'powerUps'] as const) {
    if (data[key] === undefined) continue;
    if (typeof data[key] !== 'boolean') throw new InputError('Invalid room settings.');
    result[key] = data[key];
  }
  if (data.categories !== undefined) {
    const allowed: Category[] = ['language', 'framework', 'company', 'bug', 'funny', 'incident', 'ai'];
    if (!Array.isArray(data.categories) || !data.categories.every(
      (category): category is Category => allowed.some((item) => item === category),
    )) throw new InputError('Invalid categories.');
    result.categories = data.categories;
  }
  return result;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const match = /^\/api\/rooms\/(new|[A-Z2-9]{4})$/.exec(url.pathname);
    if (!match) return Response.json({ error: 'Not found.' }, { status: 404 });
    if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WebSocket connection required.' }, { status: 426 });
    }
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) {
      return Response.json({ error: 'Origin not allowed.' }, { status: 403 });
    }
    const creating = match[1] === 'new';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = creating ? makeCode() : match[1];
      const stub = env.ROOMS.getByName(code);
      const response = await stub.fetch(new Request(
        `https://room.internal/${code}/${creating ? 'create' : 'join'}`, request,
      ));
      if (!creating || response.status !== 409) return response;
    }
    return Response.json({ error: 'Could not allocate a room. Try again.' }, { status: 503 });
  },
} satisfies ExportedHandler<Env>;

interface Session {
  id: string;
  creator: boolean;
}

export class GameRoom extends DurableObject<Env> {
  private room: Room | null = null;
  private outbox: { socket: WebSocket; message: string }[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get<Room>('room')) ?? null;
    });
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request: Request): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const [, code, action] = new URL(request.url).pathname.split('/');
      if (action === 'create') {
        if (this.room || this.ctx.getWebSockets().length) return new Response(null, { status: 409 });
        this.room = createRoom(code);
      }
      if (this.ctx.getWebSockets().length >= 16) {
        return new Response('Room is full.', { status: 429 });
      }
      const pair = new WebSocketPair();
      const session: Session = { id: crypto.randomUUID(), creator: action === 'create' };
      pair[1].serializeAttachment(session);
      this.ctx.acceptWebSocket(pair[1]);
      await this.persist();
      return new Response(null, { status: 101, webSocket: pair[0] });
    });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.ctx.blockConcurrencyWhile(async () => {
      let requestId: number | undefined;
      try {
        if (typeof message !== 'string' || message.length > 8192) {
          throw new InputError('Invalid or oversized message.');
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(message);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          throw new InputError('Invalid JSON.');
        }
        const envelope = record(parsed);
        if (envelope.requestId !== undefined) {
          if (typeof envelope.requestId !== 'number' || !Number.isSafeInteger(envelope.requestId)) {
            throw new InputError('Invalid request ID.');
          }
          requestId = envelope.requestId;
        }
        if (typeof envelope.event !== 'string') throw new InputError('Invalid event.');
        this.advanceDeadline();
        const response = this.handle(socket, envelope.event, envelope.data);
        if (requestId !== undefined) this.queue(socket, 'ack', response, requestId);
      } catch (error) {
        if (!(error instanceof InputError)) {
          console.error('Game message failed', error);
          throw error;
        }
        if (requestId !== undefined) {
          this.queue(socket, 'ack', { ok: false, error: error.message }, requestId);
        } else {
          this.queue(socket, 'error', { message: error.message });
        }
      }
      await this.persist();
      this.flush();
    });
  }

  private handle(socket: WebSocket, event: string, payload: unknown): object {
    const session = socket.deserializeAttachment() as Session;
    const room = this.room;
    if (event === 'room:create' || event === 'room:join') {
      if (!room || (event === 'room:join' && !room.hostId)) throw new InputError('Room not found.');
      if ((event === 'room:create') !== session.creator || room.players.has(session.id)) {
        throw new InputError('Already connected. Leave this room first.');
      }
      if (room.status !== 'lobby') throw new InputError('Game already in progress.');
      if (room.players.size >= 12) throw new InputError('Room is full.');
      const data = record(payload);
      if (typeof data.name !== 'string' || !data.name.trim()) throw new InputError('Enter a display name first.');
      const playerProfile = profile(data.profile);
      if (event === 'room:create' && data.settings !== undefined) applySettings(room, settings(data.settings));
      addPlayer(room, session.id, data.name, playerProfile);
      // The joining client must learn its ID before receiving the room snapshot.
      this.queue(socket, 'session', { playerId: session.id });
      this.broadcastRoom();
      return { ok: true, code: room.code, playerId: session.id };
    }
    if (!room || !room.players.has(session.id)) throw new InputError('No room. Join a room first.');
    const hostOnly = () => {
      if (room.hostId !== session.id) throw new InputError('Only the host can do that.');
    };
    switch (event) {
      case 'profile:update':
        if (room.status !== 'lobby' && room.status !== 'over') throw new InputError('Wait until the game ends.');
        updatePlayerProfile(room, session.id, profile(payload) ?? {});
        break;
      case 'room:settings':
        hostOnly();
        if (room.status !== 'lobby') throw new InputError('Settings can only change in the lobby.');
        applySettings(room, settings(payload));
        break;
      case 'game:start':
        hostOnly();
        if (room.status !== 'lobby' && room.status !== 'over') throw new InputError('Game already in progress.');
        startGame(room);
        beginRound(room);
        this.emitRoundStart();
        break;
      case 'answer:submit': {
        const choice = record(payload).choice;
        if (typeof choice !== 'number' || !submitAnswer(room, session.id, choice)) {
          throw new InputError('Answer rejected: the round ended or you already answered.');
        }
        if (allAnswered(room)) this.endRound();
        break;
      }
      case 'powerup:use': {
        const type = record(payload).type;
        const allowed: PowerupType[] = ['fifty', 'shield', 'smoke', 'double', 'freeze', 'spy'];
        const powerup = allowed.find((item) => item === type);
        if (!powerup) throw new InputError('Unknown power-up.');
        const result = usePowerup(room, session.id, powerup);
        if (!result.ok) throw new InputError(result.error ?? 'Power-up unavailable.');
        if (powerup === 'smoke') {
          this.broadcast('powerup:smoked', {
            fromName: room.players.get(session.id)!.name, durationMs: 6000,
          }, socket);
        }
        if (powerup === 'freeze') this.broadcast('round:timeExtended', { endsAt: room.endsAt });
        this.broadcastRoom();
        return result;
      }
      case 'game:restart':
        hostOnly();
        room.status = 'lobby';
        room.roundIndex = -1;
        room.questions = [];
        room.endsAt = 0;
        room.revealEndsAt = 0;
        for (const player of room.players.values()) {
          Object.assign(player, {
            score: 0, streak: 0, lastPoints: 0, answered: false, choice: null,
            shield: false, doubleDown: false, usedPowerups: [],
          });
        }
        break;
      case 'room:leave':
        this.leave(socket);
        socket.close(1000, 'Left room.');
        return { ok: true };
      default:
        throw new InputError('Unknown event.');
    }
    this.broadcastRoom();
    return { ok: true };
  }

  private advanceDeadline(): void {
    const room = this.room;
    if (!room) return;
    if (room.status === 'playing' && Date.now() >= room.endsAt) {
      this.endRound();
    } else if (room.status === 'reveal' && Date.now() >= room.revealEndsAt) {
      if (beginRound(room)) this.emitRoundStart();
      else this.broadcast('game:over', { leaderboard: leaderboard(room) });
      this.broadcastRoom();
    }
  }

  private emitRoundStart(): void {
    const room = this.room!;
    const question = currentQuestion(room)!;
    this.broadcast('round:start', {
      question: toPublicQuestion(question), index: room.roundIndex,
      total: room.questions.length, endsAt: room.endsAt,
    });
  }

  private endRound(): void {
    const room = this.room!;
    const question = currentQuestion(room)!;
    room.status = 'reveal';
    room.revealEndsAt = Date.now() + (question.category === 'incident' ? 15000 : question.category === 'ai' ? 10000 : 5000);
    const results = Object.fromEntries([...room.players.values()].map((player) => [player.id, {
      choice: player.choice,
      correct: player.choice !== null && question.options[player.choice] === question.answer,
      points: player.lastPoints,
    }]));
    this.broadcast('round:result', {
      correctIndex: question.options.indexOf(question.answer), answer: question.answer,
      fact: question.fact ?? null, results, leaderboard: leaderboard(room),
    });
    this.broadcastRoom();
  }

  private queue(socket: WebSocket, event: string, data: object, requestId?: number): void {
    this.outbox.push({ socket, message: JSON.stringify({ event, data, requestId }) });
  }

  private broadcast(event: string, data: object, except?: WebSocket): void {
    for (const socket of this.ctx.getWebSockets()) {
      const session = socket.deserializeAttachment() as Session;
      if (socket !== except && this.room?.players.has(session.id)) this.queue(socket, event, data);
    }
  }

  private broadcastRoom(): void {
    if (this.room) this.broadcast('room:update', toPublicRoom(this.room));
  }

  private flush(): void {
    const messages = this.outbox;
    this.outbox = [];
    for (const { socket, message } of messages) {
      if (socket.readyState === WebSocket.OPEN) socket.send(message);
    }
  }

  private async persist(): Promise<void> {
    if (!this.room) {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      return;
    }
    const room = this.room;
    await this.ctx.storage.transaction(async (storage) => {
      await storage.put('room', room);
      if (room.status === 'playing') await storage.setAlarm(room.endsAt);
      else if (room.status === 'reveal') await storage.setAlarm(room.revealEndsAt);
      else if (!room.players.size) await storage.setAlarm(Date.now() + 30000);
      else await storage.deleteAlarm();
    });
  }

  async alarm(): Promise<void> {
    await this.ctx.blockConcurrencyWhile(async () => {
      if (this.room && !this.room.players.size) {
        this.room = null;
        for (const socket of this.ctx.getWebSockets()) socket.close(1000, 'Room expired.');
      }
      this.advanceDeadline();
      await this.persist();
      this.flush();
    });
  }

  private leave(socket: WebSocket): void {
    const session = socket.deserializeAttachment() as Session;
    const room = this.room;
    if (!room) return;
    if (!room.players.has(session.id) && !(session.creator && !room.hostId)) return;
    removePlayer(room, session.id);
    if (!room.players.size) {
      this.room = null;
      for (const peer of this.ctx.getWebSockets()) {
        if (peer !== socket) peer.close(1000, 'Room closed.');
      }
      return;
    }
    if (room.status === 'playing' && allAnswered(room)) this.endRound();
    this.broadcastRoom();
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.ctx.blockConcurrencyWhile(async () => {
      this.leave(socket);
      await this.persist();
      this.flush();
    });
  }

  async webSocketError(socket: WebSocket, error: unknown): Promise<void> {
    console.error('Game WebSocket failed', error);
    socket.close(1011, 'Connection failed.');
    await this.webSocketClose(socket);
  }
}
