import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import {
  addPlayer,
  allAnswered,
  applySettings,
  beginRound,
  createRoom,
  currentQuestion,
  deleteRoom,
  getRoom,
  leaderboard,
  removePlayer,
  startGame,
  submitAnswer,
  toPublicQuestion,
  toPublicRoom,
  updatePlayerProfile,
  usePowerup,
} from './rooms.js';
import type { PowerupType } from './rooms.js';
import type { PlayerProfile, Room, RoomSettings } from './types.js';

const PORT = Number(process.env.PORT) || 3001;
const REVEAL_MS = 5000;
const SMOKE_MS = 6000;

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/** Map of socket.id -> room code, so we can clean up on disconnect. */
const socketRoom = new Map<string, string>();

function broadcastRoom(room: Room): void {
  io.to(room.code).emit('room:update', toPublicRoom(room));
}

function emitRoundStart(room: Room): void {
  const q = currentQuestion(room);
  if (!q) return;
  io.to(room.code).emit('round:start', {
    question: toPublicQuestion(q),
    index: room.roundIndex,
    total: room.questions.length,
    endsAt: room.endsAt,
  });
  broadcastRoom(room);
}

function endRound(room: Room): void {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  const q = currentQuestion(room);
  if (!q) return;
  room.status = 'reveal';

  const correctIndex = q.options.indexOf(q.answer);
  const results: Record<string, { choice: number | null; correct: boolean; points: number }> = {};
  for (const p of room.players.values()) {
    results[p.id] = {
      choice: p.choice,
      correct: p.choice !== null && q.options[p.choice] === q.answer,
      points: p.lastPoints,
    };
  }

  io.to(room.code).emit('round:result', {
    correctIndex,
    answer: q.answer,
    fact: q.fact ?? null,
    results,
    leaderboard: leaderboard(room),
  });
  broadcastRoom(room);

  // Schedule the next round (or game over) after the reveal window.
  room.revealTimer = setTimeout(() => {
    room.revealTimer = null;
    const hasNext = beginRound(room);
    if (hasNext) {
      emitRoundStart(room);
      room.timer = setTimeout(() => endRound(room), room.settings.roundTime * 1000);
    } else {
      io.to(room.code).emit('game:over', { leaderboard: leaderboard(room) });
      broadcastRoom(room);
    }
  }, REVEAL_MS);
}

function launchGame(room: Room): void {
  startGame(room);
  beginRound(room);
  emitRoundStart(room);
  room.timer = setTimeout(() => endRound(room), room.settings.roundTime * 1000);
}

io.on('connection', (socket) => {
  socket.on(
    'room:create',
    (
      payload: { name: string; settings?: Partial<RoomSettings>; profile?: Partial<PlayerProfile> },
      ack: (res: { ok: boolean; code?: string; playerId?: string; error?: string }) => void,
    ) => {
      try {
        const room = createRoom();
        if (payload.settings) applySettings(room, payload.settings);
        addPlayer(room, socket.id, payload.name, payload.profile);
        socket.join(room.code);
        socketRoom.set(socket.id, room.code);
        ack({ ok: true, code: room.code, playerId: socket.id });
        broadcastRoom(room);
      } catch {
        ack({ ok: false, error: 'Could not create room.' });
      }
    },
  );

  socket.on(
    'room:join',
    (
      payload: { code: string; name: string; profile?: Partial<PlayerProfile> },
      ack: (res: { ok: boolean; code?: string; playerId?: string; error?: string }) => void,
    ) => {
      const room = getRoom(payload.code);
      if (!room) return ack({ ok: false, error: 'Room not found.' });
      if (room.status !== 'lobby') return ack({ ok: false, error: 'Game already in progress.' });
      if (room.players.size >= 12) return ack({ ok: false, error: 'Room is full.' });

      addPlayer(room, socket.id, payload.name, payload.profile);
      socket.join(room.code);
      socketRoom.set(socket.id, room.code);
      ack({ ok: true, code: room.code, playerId: socket.id });
      broadcastRoom(room);
    },
  );

  socket.on('profile:update', (payload: Partial<PlayerProfile>) => {
    const room = getRoom(socketRoom.get(socket.id) ?? '');
    if (!room) return;
    // Cosmetic only, and only while nothing is mid-round.
    if (room.status !== 'lobby' && room.status !== 'over') return;
    if (updatePlayerProfile(room, socket.id, payload)) broadcastRoom(room);
  });

  socket.on('room:settings', (payload: Partial<RoomSettings>) => {
    const room = getRoom(socketRoom.get(socket.id) ?? '');
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;
    applySettings(room, payload);
    broadcastRoom(room);
  });

  socket.on('game:start', () => {
    const room = getRoom(socketRoom.get(socket.id) ?? '');
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'lobby' && room.status !== 'over') return;
    if (room.players.size < 1) return;
    launchGame(room);
  });

  socket.on('answer:submit', (payload: { choice: number }) => {
    const room = getRoom(socketRoom.get(socket.id) ?? '');
    if (!room) return;
    const ok = submitAnswer(room, socket.id, payload.choice);
    if (!ok) return;
    broadcastRoom(room);
    if (allAnswered(room)) endRound(room);
  });

  socket.on(
    'powerup:use',
    (
      payload: { type: PowerupType },
      ack?: (res: { ok: boolean; error?: string; type?: PowerupType; hiddenIndices?: number[] }) => void,
    ) => {
      const room = getRoom(socketRoom.get(socket.id) ?? '');
      if (!room) return ack?.({ ok: false, error: 'No room.' });
      const res = usePowerup(room, socket.id, payload?.type);
      if (res.ok) {
        if (res.type === 'smoke') {
          const fromName = room.players.get(socket.id)?.name ?? 'Someone';
          socket.to(room.code).emit('powerup:smoked', { fromName, durationMs: SMOKE_MS });
        }
        broadcastRoom(room);
      }
      ack?.(res);
    },
  );

  socket.on('game:restart', () => {
    const room = getRoom(socketRoom.get(socket.id) ?? '');
    if (!room || room.hostId !== socket.id) return;
    if (room.timer) clearTimeout(room.timer);
    if (room.revealTimer) clearTimeout(room.revealTimer);
    room.timer = null;
    room.revealTimer = null;
    room.status = 'lobby';
    room.roundIndex = -1;
    room.questions = [];
    for (const p of room.players.values()) {
      p.score = 0;
      p.streak = 0;
      p.lastPoints = 0;
      p.answered = false;
      p.choice = null;
      p.shield = false;
      p.usedPowerups = [];
    }
    broadcastRoom(room);
  });

  socket.on('room:leave', () => handleLeave(socket.id));

  socket.on('disconnect', () => handleLeave(socket.id));

  function handleLeave(id: string): void {
    const code = socketRoom.get(id);
    if (!code) return;
    const room = getRoom(code);
    socketRoom.delete(id);
    if (!room) return;

    removePlayer(room, id);

    if (room.players.size === 0) {
      deleteRoom(code);
      return;
    }

    // If everyone remaining has already answered, close the round early.
    if (room.status === 'playing' && allAnswered(room)) {
      endRound(room);
    }
    broadcastRoom(room);
  }
});

// Serve the built client so the whole app runs as a single service.
const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../client/dist',
);
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

server.listen(PORT, () => {
  console.log(`DevGuessr server listening on http://localhost:${PORT}`);
});
