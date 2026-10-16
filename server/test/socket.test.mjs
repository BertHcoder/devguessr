import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../client/src/socket.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

async function client() {
  let now = 100000;
  let nextTimer = 0;
  const intervals = new Map();
  const timeouts = new Map();
  const sockets = [];
  class WebSocket {
    static OPEN = 1;
    readyState = 0;
    sent = [];
    constructor(url) {
      this.url = String(url);
      sockets.push(this);
    }
    open() {
      this.readyState = 1;
      this.onopen();
    }
    send(message) { this.sent.push(message); }
    close() { this.readyState = 3; }
    receive(event, data, requestId) {
      this.onmessage({ data: JSON.stringify({ event, data, requestId }) });
    }
  }
  const context = {
    exports: {}, WebSocket, URL, AbortSignal, console,
    location: { href: 'https://game.example/', protocol: 'https:' },
    Date: { now: () => now },
    fetch: async (url) => {
      assert.equal(url, '/health');
      return { ok: true, json: async () => ({ ok: true }) };
    },
    setTimeout: (fn) => { timeouts.set(++nextTimer, fn); return nextTimer; },
    clearTimeout: (id) => timeouts.delete(id),
    setInterval: (fn) => { intervals.set(++nextTimer, fn); return nextTimer; },
    clearInterval: (id) => intervals.delete(id),
  };
  vm.runInNewContext(compiled, context);
  await new Promise((resolve) => setImmediate(resolve));
  return {
    socket: context.exports.socket, sockets, timeouts,
    tick(ms) {
      now += ms;
      for (const callback of intervals.values()) callback();
    },
  };
}

test('native client connects on the same origin, dispatches events, and acknowledges requests', async () => {
  const { socket, sockets } = await client();
  assert.equal(socket.connected, true);
  const replies = [];
  socket.emit('room:create', { name: 'Host' }, (response) => replies.push(response));
  const ws = sockets[0];
  assert.equal(ws.url, 'wss://game.example/api/rooms/new');
  ws.open();
  const request = JSON.parse(ws.sent[0]);
  assert.equal(request.event, 'room:create');
  ws.receive('session', { playerId: 'host' });
  assert.equal(socket.id, 'host');
  const rooms = [];
  const listener = (room) => rooms.push(room);
  socket.on('room:update', listener);
  ws.receive('room:update', { code: 'ABCD' });
  socket.off('room:update', listener);
  ws.receive('room:update', { code: 'OTHER' });
  assert.equal(rooms.length, 1);
  ws.receive('ack', { ok: true, code: 'ABCD', playerId: 'host' }, request.requestId);
  assert.equal(replies[0].ok, true);
  socket.emit('room:leave');
  assert.equal(ws.readyState, 3);
  assert.equal(socket.id, undefined);
  assert.equal(socket.connected, true);
});

test('failed joins and timeouts do not leave the client busy or in a ghost room', async () => {
  const { socket, sockets, timeouts } = await client();
  const responses = [];
  socket.emit('room:join', { code: 'ABCD', name: 'Peer' }, (response) => responses.push(response));
  sockets[0].open();
  sockets[0].receive('ack', { ok: false, error: 'Room not found.' }, 1);
  assert.equal(responses[0].error, 'Room not found.');
  assert.equal(sockets[0].readyState, 3);
  assert.equal(timeouts.size, 0);
  let disconnected = false;
  socket.on('disconnect', () => { disconnected = true; });
  socket.emit('room:create', { name: 'Host' }, (response) => responses.push(response));
  sockets[1].open();
  const timeout = [...timeouts.values()][0];
  timeout();
  assert.match(responses[1].error, /timed out/);
  assert.equal(disconnected, true);
  assert.equal(sockets[1].readyState, 3);
});

test('heartbeat tolerates suspended browser timers but detects an unanswered probe', async () => {
  const { socket, sockets, tick } = await client();
  socket.emit('room:create', { name: 'Host' });
  const ws = sockets[0];
  ws.open();
  ws.receive('session', { playerId: 'host' });
  ws.receive('ack', { ok: true }, 1);
  tick(60000);
  assert.equal(ws.readyState, 1);
  assert.equal(ws.sent.at(-1), 'ping');
  ws.onmessage({ data: 'pong' });
  tick(15000);
  for (let i = 0; i < 4; i++) tick(15000);
  assert.equal(ws.readyState, 3);
  assert.equal(socket.connected, false);
});
