import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { ALL_QUESTIONS, ANSWER_POOLS, CONTENT_REVIEWED_ON } from '../dist/gameData.js';
import {
  addPlayer,
  allAnswered,
  applySettings,
  beginRound,
  createRoom,
  currentQuestion,
  DEFAULT_SETTINGS,
  startGame,
  submitAnswer,
  toPublicQuestion,
  usePowerup,
} from '../dist/rooms.js';

test('question IDs are unique and bug answers refer to nonempty snippet lines', () => {
  assert.equal(new Set(ALL_QUESTIONS.map((question) => question.id)).size, ALL_QUESTIONS.length);
  for (const question of ALL_QUESTIONS.filter((question) => question.category === 'bug')) {
    assert.equal(question.answer, `Line ${question.bugLine}`, question.id);
    assert.ok(question.code.split('\n')[question.bugLine - 1]?.trim(), question.id);
  }
});

test('corrected facts and bug locations stay grounded in their evidence', () => {
  const figma = ALL_QUESTIONS.find((question) => question.id === 'co-figma');
  assert.match(figma.fact, /terminated.*December 2023/);
  const zig = ALL_QUESTIONS.find((question) => question.id === 'lang-zig');
  assert.ok(zig.code.includes('std.debug.print("{}\\n", .{sum});'));
  const scope = ALL_QUESTIONS.find((question) => question.id === 'bug-py-scope');
  assert.equal(scope.bugLine, 4);
  assert.equal(scope.code.split('\n')[scope.bugLine - 1].trim(), 'total += n');
  const shallow = ALL_QUESTIONS.find((question) => question.id === 'bug-ts-shallow');
  assert.equal(shallow.bugLine, 2);
  assert.equal(shallow.code.split('\n')[shallow.bugLine - 1], 'const copy = { ...original };');
  const semicolon = ALL_QUESTIONS.find((question) => question.id === 'bug-cs-semicolon');
  const numbers = semicolon.code.match(/int\[\] nums = \{ ([\d, ]+) \}/)[1].split(', ').map(Number);
  assert.notEqual(numbers.at(-1), Math.max(...numbers));
});

test('six incidents have evidence, plausible authored choices, and reveal reasoning', () => {
  const incidents = ALL_QUESTIONS.filter((question) => question.category === 'incident');
  assert.equal(incidents.length, 6);
  for (const question of incidents) {
    assert.equal(question.type, 'incident');
    assert.ok(question.prompt.length > 0, question.id);
    assert.ok(question.incident.logs.split('\n').length >= 3, question.id);
    assert.match(question.incident.diff, /^- /m);
    assert.match(question.incident.diff, /^\+ /m);
    assert.equal(question.distractors.length, 3, question.id);
    assert.equal(new Set([question.answer, ...question.distractors]).size, 4, question.id);
    for (const choice of [question.answer, ...question.distractors]) {
      assert.ok(ANSWER_POOLS.incident.includes(choice), question.id);
    }
    assert.match(question.fact, /Why not .+\? /, question.id);
  }
});

test('every category generates four unique playable choices without revealing private fields', () => {
  assert.ok(DEFAULT_SETTINGS.categories.includes('incident'));
  assert.ok(DEFAULT_SETTINGS.categories.includes('ai'));
  for (const category of DEFAULT_SETTINGS.categories) {
    const room = createRoom();
    applySettings(room, { categories: [category], rounds: 20 });
    const authoredQuestions = ALL_QUESTIONS.filter((question) => question.category === category);
    const visited = new Set();
    for (let game = 0; game < Math.ceil(authoredQuestions.length / 20); game++) {
      room.recentQuestionIds = [...visited];
      startGame(room);
      assert.ok(room.questions.length > 0, category);
      for (const question of room.questions) {
        visited.add(question.id);
        assert.equal(question.category, category);
        assert.equal(question.options.length, 4, question.id);
        assert.equal(new Set(question.options).size, 4, question.id);
        assert.ok(question.options.includes(question.answer), question.id);
        const publicQuestion = JSON.parse(JSON.stringify(toPublicQuestion(question)));
        for (const privateField of ['answer', 'bugLine', 'fact', 'distractors', 'sources', 'reviewedOn']) {
          assert.equal(Object.hasOwn(publicQuestion, privateField), false, question.id);
        }
        if (question.incident) assert.deepEqual(publicQuestion.incident, question.incident);
        if (category === 'incident' || category === 'ai') {
          const authored = ALL_QUESTIONS.find((raw) => raw.id === question.id);
          assert.deepEqual([...question.options].sort(), [authored.answer, ...authored.distractors].sort());
        }
      }
    }
    assert.equal(visited.size, authoredQuestions.length, category);
  }
});

test('incident rounds use authoritative scoring and normal round completion', () => {
  const room = createRoom();
  applySettings(room, { categories: ['incident'], rounds: 6, powerUps: true });
  addPlayer(room, 'correct-player', 'Correct');
  addPlayer(room, 'wrong-player', 'Wrong');
  startGame(room);
  assert.equal(room.questions.length, 6);
  assert.equal(new Set(room.questions.map((question) => question.id)).size, 6);
  for (let index = 0; index < 6; index++) {
    assert.equal(beginRound(room), true);
    const question = currentQuestion(room);
    const correctIndex = question.options.indexOf(question.answer);
    const wrongIndex = question.options.findIndex((choice) => choice !== question.answer);
    const player = room.players.get('correct-player');
    const scoreBefore = player.score;
    assert.equal(submitAnswer(room, player.id, correctIndex), true);
    assert.ok(player.lastPoints >= 500);
    assert.equal(player.score, scoreBefore + player.lastPoints);
    assert.equal(submitAnswer(room, player.id, wrongIndex), false);
    assert.equal(allAnswered(room), false);
    assert.equal(submitAnswer(room, 'wrong-player', wrongIndex), true);
    assert.equal(room.players.get('wrong-player').lastPoints, 0);
    assert.equal(allAnswered(room), true);
  }
  assert.equal(beginRound(room), false);
  assert.equal(room.status, 'over');
});

test('50/50 never removes the incident root cause', () => {
  const room = createRoom();
  applySettings(room, { categories: ['incident'], rounds: 6, powerUps: true });
  const player = addPlayer(room, 'player', 'Player');
  startGame(room);
  for (const question of room.questions) {
    beginRound(room);
    player.score = 1000;
    const result = usePowerup(room, player.id, 'fifty');
    assert.equal(result.ok, true);
    assert.equal(result.hiddenIndices.length, 2);
    assert.equal(result.hiddenIndices.includes(question.options.indexOf(question.answer)), false);
    assert.equal(player.score, 880);
  }
});

test('every logo question has an icon in the installed catalog', () => {
  for (const question of ALL_QUESTIONS.filter((question) => question.type === 'logo')) {
    assert.ok(existsSync(new URL(`../../node_modules/simple-icons/icons/${question.slug}.svg`, import.meta.url))
      || existsSync(new URL(`../../../node_modules/simple-icons/icons/${question.slug}.svg`, import.meta.url)), question.id);
  }
});

test('all questions have a review date and AI questions retain sources and bounded choices', () => {
  assert.match(CONTENT_REVIEWED_ON, /^\d{4}-\d{2}-\d{2}$/);
  for (const question of ALL_QUESTIONS) {
    assert.equal(question.reviewedOn, CONTENT_REVIEWED_ON, question.id);
    assert.ok(question.prompt.trim(), question.id);
    assert.ok(question.answer.trim(), question.id);
    assert.ok(question.fact?.trim(), question.id);
    if (question.type === 'code') assert.ok(question.code?.trim(), question.id);
    if (question.category !== 'ai') continue;
    assert.equal(question.type, 'text');
    assert.equal(question.distractors.length, 3, question.id);
    assert.equal(new Set([question.answer, ...question.distractors]).size, 4, question.id);
    assert.ok(question.sources.length > 0, question.id);
    for (const source of question.sources) assert.equal(new URL(source).protocol, 'https:');
    if (question.id.startsWith('ai-current-')) assert.ok(question.prompt.includes(CONTENT_REVIEWED_ON), question.id);
  }
  assert.equal(ALL_QUESTIONS.filter((question) => question.category === 'ai').length, 26);
});

test('audited language snippets have balanced Lisp-family forms and no broken quoted newline escapes', () => {
  for (const id of ['lang-clojure', 'lang-lisp', 'lang-scheme', 'lang-racket']) {
    const question = ALL_QUESTIONS.find((entry) => entry.id === id);
    const withoutStrings = question.code.replace(/"(?:\\.|[^"\\])*"/g, '""');
    let depth = 0;
    for (const character of withoutStrings) {
      if (character === '(') depth++;
      if (character === ')') depth--;
      assert.ok(depth >= 0, id);
    }
    assert.equal(depth, 0, id);
  }
  for (const id of ['lang-perl', 'lang-ocaml', 'lang-zig']) {
    const question = ALL_QUESTIONS.find((entry) => entry.id === id);
    assert.ok(question.code.includes('\\n"'), id);
  }
  assert.match(ALL_QUESTIONS.find((question) => question.id === 'fw-svelte').code, /\$state\(0\)/);
  assert.match(ALL_QUESTIONS.find((question) => question.id === 'fw-remix').code, /@remix-run\/react/);
  assert.match(ALL_QUESTIONS.find((question) => question.id === 'fw-nextjs').code, /next\/navigation/);
});

test('JavaScript bug examples reproduce the defect and the indicated line repair fixes it', async () => {
  const cases = [
    { id: 'bug-js-offbyone', expression: 'sum([1, 2, 3])', broken: 'NaN', from: 'i <= arr.length', to: 'i < arr.length', fixed: '6' },
    { id: 'bug-js-varclosure', expression: 'makeCounters().map(counter => counter())', broken: '[3,3,3]', from: 'var i', to: 'let i', fixed: '[0,1,2]' },
    { id: 'bug-js-sort', expression: 'sortNums([10, 2, 1, 20])', broken: '[1,10,2,20]', from: 'arr.sort()', to: 'arr.sort((first, second) => first - second)', fixed: '[1,2,10,20]' },
    { id: 'bug-js-typeof', expression: 'isObject(null)', broken: 'true', from: 'typeof val === "object"', to: 'val !== null && typeof val === "object"', fixed: 'false' },
  ];
  for (const example of cases) {
    const question = ALL_QUESTIONS.find((entry) => entry.id === example.id);
    assert.ok(question.code.split('\n')[question.bugLine - 1].includes(example.from), example.id);
    const sandbox = { console: { log() {} } };
    const serialize = value => Array.isArray(value) ? JSON.stringify(value) : String(value);
    assert.equal(serialize(vm.runInNewContext(`${question.code}\n${example.expression}`, sandbox)), example.broken, example.id);
    assert.equal(serialize(vm.runInNewContext(`${question.code.replace(example.from, example.to)}\n${example.expression}`, sandbox)), example.fixed, example.id);
  }
  const awaiting = ALL_QUESTIONS.find((question) => question.id === 'bug-js-await');
  const sandbox = { fetch: async () => ({ json: async () => ({ id: 42 }) }) };
  await assert.rejects(vm.runInNewContext(`${awaiting.code}\ngetUser(42)`, sandbox), /res\.json is not a function/);
  const result = await vm.runInNewContext(`${awaiting.code.replace('const res = fetch', 'const res = await fetch')}\ngetUser(42)`, sandbox);
  assert.equal(result.id, 42);
});

test('AI rounds support scoring, replay variety, and 50/50 without hiding the correct concept', () => {
  const room = createRoom();
  applySettings(room, { categories: ['ai'], rounds: 8, powerUps: true });
  const player = addPlayer(room, 'ai-player', 'AI player');
  startGame(room);
  const firstGame = new Set(room.questions.map((question) => question.id));
  for (const question of room.questions) {
    beginRound(room);
    player.score = 1000;
    const correctIndex = question.options.indexOf(question.answer);
    const powerup = usePowerup(room, player.id, 'fifty');
    assert.equal(powerup.ok, true);
    assert.equal(powerup.hiddenIndices.length, 2);
    assert.equal(powerup.hiddenIndices.includes(correctIndex), false);
    assert.equal(submitAnswer(room, player.id, correctIndex), true);
    assert.ok(player.lastPoints >= 500);
    assert.equal(allAnswered(room), true);
  }
  assert.equal(beginRound(room), false);
  startGame(room);
  assert.ok(room.questions.every((question) => !firstGame.has(question.id)));
});

test('expired deadlines reject answers and power-ups, and freeze cannot inflate speed scoring', () => {
  const room = createRoom();
  applySettings(room, { powerUps: true });
  const player = addPlayer(room, 'player', 'Player');
  startGame(room);
  beginRound(room);
  player.score = 1000;
  const choice = currentQuestion(room).options.indexOf(currentQuestion(room).answer);
  room.endsAt = Date.now() - 1;
  assert.equal(submitAnswer(room, player.id, choice), false);
  assert.equal(usePowerup(room, player.id, 'freeze').ok, false);
  room.endsAt = Date.now() + room.settings.roundTime * 1000 + 5000;
  assert.equal(submitAnswer(room, player.id, choice), true);
  assert.equal(player.lastPoints, 1000);
});