import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createTestHarness } from 'wrangler';
import { ALL_QUESTIONS } from '../dist/gameData.js';

const harness = createTestHarness({ workers: [{ configPath: 'wrangler.jsonc' }] });
const worker = harness.getWorker();
before(() => harness.listen());
after(() => harness.close());

async function connect(t, code = 'new', name = 'Host', settings) {
  const response = await harness.fetch(`/api/rooms/${code}`, { headers: { Upgrade: 'websocket' } });
  assert.equal(response.status, 101);
  const ws = response.webSocket;
  const messages = [];
  const waiters = new Set();
  let requestId = 0;
  const next = (event, predicate = () => true, timeout = 3000) => {
    const index = messages.findIndex((message) => message.event === event && predicate(message));
    if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { event, predicate, resolve, timer: undefined };
      waiter.timer = setTimeout(() => {
        waiters.delete(waiter);
        reject(new Error(`Timed out waiting for ${event}`));
      }, timeout);
      waiters.add(waiter);
    });
  };
  ws.addEventListener('message', ({ data }) => {
    const message = data === 'pong' ? { event: 'pong' } : JSON.parse(data);
    const waiter = [...waiters].find((item) => item.event === message.event && item.predicate(message));
    if (waiter) {
      clearTimeout(waiter.timer);
      waiters.delete(waiter);
      waiter.resolve(message);
    } else messages.push(message);
  });
  ws.accept();
  t.after(() => {
    if (ws.readyState === 1) ws.close();
    for (const waiter of waiters) clearTimeout(waiter.timer);
  });
  const send = async (event, data) => {
    const id = ++requestId;
    ws.send(JSON.stringify({ event, data, requestId: id }));
    return (await next('ack', (message) => message.requestId === id)).data;
  };
  const joined = await send(code === 'new' ? 'room:create' : 'room:join', { name, settings });
  return { ws, next, send, messages, joined };
}

test('Cloudflare serves assets, health, and explicit API errors without a separate origin', async () => {
  const health = await harness.fetch('/health');
  assert.equal(health.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await health.json(), { ok: true });
  const home = await harness.fetch('/');
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /DevGuessr/);
  const script = html.match(/src="([^"]+\.js)"/)[1];
  const bundle = await (await harness.fetch(script)).text();
  assert.doesNotMatch(bundle, /socket\.io|VITE_SERVER_URL/);
  assert.match(bundle, /\/api\/rooms\//);
  assert.equal((await harness.fetch('/some-client-route')).status, 200);
  assert.equal((await harness.fetch('/api/missing')).status, 404);
  assert.equal((await harness.fetch('/api/rooms/new')).status, 426);
  assert.equal((await harness.fetch('/api/rooms/new', {
    headers: { Upgrade: 'websocket', Origin: 'https://unrelated.example' },
  })).status, 403);
});

test('room isolation, permissions, profile updates, and malformed messages', async (t) => {
  const host = await connect(t);
  assert.equal(host.joined.ok, true);
  assert.match(host.joined.code, /^[A-Z2-9]{4}$/);
  const peer = await connect(t, host.joined.code, 'Peer');
  assert.equal(peer.joined.ok, true);
  const isolated = await connect(t);
  assert.notEqual(isolated.joined.code, host.joined.code);
  const fullRoom = (await peer.next('room:update')).data;
  assert.equal(fullRoom.players.length, 2);
  assert.equal((await isolated.next('room:update')).data.players.length, 1);
  assert.equal((await peer.send('game:start')).ok, false);
  assert.equal((await peer.send('game:restart')).ok, false);
  assert.equal((await peer.send('room:settings', { rounds: 20 })).ok, false);
  assert.equal((await host.send('room:settings', { rounds: 'bad' })).ok, false);
  assert.equal((await host.send('room:settings', { categories: [42] })).ok, false);
  assert.equal((await host.send('profile:update', { name: 'Updated', color: '#123456' })).ok, true);
  const updated = await peer.next('room:update', (message) => message.data.players.some((player) => player.name === 'Updated'));
  assert.equal(updated.data.players.find((player) => player.name === 'Updated').color, '#123456');
  host.ws.send('{');
  assert.match((await host.next('error')).data.message, /JSON/);
  host.ws.send('x'.repeat(8193));
  assert.match((await host.next('error')).data.message, /oversized/);
  assert.equal((await host.send('unknown:event')).ok, false);
  host.ws.send('ping');
  await host.next('pong');
});

test('lobby and socket identity survive Durable Object hibernation', async (t) => {
  const host = await connect(t, 'new', 'Host', { rounds: 3, categories: ['funny'] });
  const peer = await connect(t, host.joined.code, 'Peer');
  await worker.evictDurableObject('GameRoom', { name: host.joined.code, webSockets: 'hibernate' });
  assert.equal((await host.send('room:settings', { roundTime: 7 })).ok, true);
  const restored = await peer.next('room:update', (message) => message.data.settings.roundTime === 7);
  assert.equal(restored.data.hostId, host.joined.playerId);
  assert.equal(restored.data.players.length, 2);
  assert.deepEqual(restored.data.settings.categories, ['funny']);
});

test('room capacity and missing-room failures are explicit', async (t) => {
  const host = await connect(t);
  for (let index = 1; index < 12; index++) {
    const peer = await connect(t, host.joined.code, `Player ${index}`);
    assert.equal(peer.joined.ok, true);
  }
  const extra = await connect(t, host.joined.code, 'Extra');
  assert.deepEqual(extra.joined, { ok: false, error: 'Room is full.' });
  const missing = await connect(t, 'IIII', 'Missing');
  assert.deepEqual(missing.joined, { ok: false, error: 'Room not found.' });
});

test('multiplayer scoring, freeze alarms, hibernation, game over, restart, and cleanup', { timeout: 45000 }, async (t) => {
  const host = await connect(t, 'new', 'Host', { rounds: 3, roundTime: 5, categories: ['funny'], powerUps: true });
  const peer = await connect(t, host.joined.code, 'Peer');
  assert.equal((await host.send('game:start')).ok, true);
  const late = await connect(t, host.joined.code, 'Late');
  assert.deepEqual(late.joined, { ok: false, error: 'Game already in progress.' });
  for (let index = 0; index < 3; index++) {
    const round = (await host.next('round:start', (message) => message.data.index === index, 12000)).data;
    const otherRound = (await peer.next('round:start', (message) => message.data.index === index, 12000)).data;
    assert.deepEqual(otherRound, round);
    for (const key of ['answer', 'bugLine', 'fact', 'distractors', 'sources', 'reviewedOn']) {
      assert.equal(Object.hasOwn(round.question, key), false, key);
    }
    const answer = ALL_QUESTIONS.find((question) => question.id === round.question.id).answer;
    const choice = round.question.options.indexOf(answer);
    if (index === 1) {
      const frozen = await host.send('powerup:use', { type: 'freeze' });
      assert.equal(frozen.ok, true);
      assert.equal(frozen.newEndsAt, round.endsAt + 5000);
      assert.equal((await host.send('powerup:use', { type: 'freeze' })).ok, false);
      assert.equal((await peer.next('round:timeExtended')).data.endsAt, frozen.newEndsAt);
      await worker.evictDurableObject('GameRoom', { name: host.joined.code, webSockets: 'hibernate' });
      await delay(Math.max(0, round.endsAt - Date.now()) + 150);
      assert.equal(host.messages.some((message) => message.event === 'round:result'), false);
      const result = (await host.next('round:result', () => true, 6500)).data;
      assert.equal(result.results[host.joined.playerId].choice, null);
      await peer.next('round:result');
    } else {
      assert.equal((await host.send('answer:submit', { choice: 1.5 })).ok, false);
      assert.equal((await host.send('answer:submit', { choice })).ok, true);
      assert.equal((await host.send('answer:submit', { choice })).ok, false);
      assert.equal((await peer.send('answer:submit', { choice })).ok, true);
      const result = (await host.next('round:result')).data;
      assert.equal(result.answer, answer);
      assert.equal(result.results[host.joined.playerId].correct, true);
      assert.ok(result.results[host.joined.playerId].points >= 500);
      assert.deepEqual((await peer.next('round:result')).data, result);
    }
  }
  const gameOver = (await host.next('game:over', () => true, 7000)).data;
  assert.equal(gameOver.leaderboard.length, 2);
  assert.deepEqual((await peer.next('game:over', () => true, 7000)).data, gameOver);
  peer.messages.length = 0;
  assert.equal((await host.send('game:restart')).ok, true);
  const restarted = await peer.next('room:update', (message) => message.data.status === 'lobby' && message.data.roundIndex === -1 && message.data.players.every((player) => player.score === 0));
  assert.equal(restarted.data.totalRounds, 3);
  host.ws.close();
  const transferred = await peer.next('room:update', (message) => message.data.hostId === peer.joined.playerId);
  assert.equal(transferred.data.players.length, 1);
  const closed = new Promise((resolve) => peer.ws.addEventListener('close', resolve, { once: true }));
  peer.ws.close();
  await closed;
  const stale = await connect(t, host.joined.code, 'Returning');
  assert.deepEqual(stale.joined, { ok: false, error: 'Room not found.' });
});

test('disconnecting the last unanswered player ends a round early', async (t) => {
  const host = await connect(t);
  const peer = await connect(t, host.joined.code, 'Peer');
  await host.send('game:start');
  await host.next('round:start');
  await host.send('answer:submit', { choice: 0 });
  peer.ws.close();
  await host.next('round:result');
});
