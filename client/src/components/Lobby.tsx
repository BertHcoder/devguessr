import { useEffect, useRef, useState } from 'react';
import { avatarColor, readStats } from '../profile';
import { socket } from '../socket';
import type { Category, PublicRoom } from '../types';
import MiniGame from './MiniGame';

interface Props {
  room: PublicRoom;
  playerId: string | null;
  onLeave: () => void;
}

const CATEGORY_META: { id: Category; label: string; icon: string }[] = [
  { id: 'language', label: 'Languages', icon: '</>' },
  { id: 'framework', label: 'Frameworks', icon: '⚙' },
  { id: 'company', label: 'Companies', icon: '★' },
  { id: 'bug', label: 'Spot the bug', icon: '🐛' },
  { id: 'funny', label: 'Name the ritual', icon: '🎭' },
  { id: 'incident', label: 'Production incident', icon: '!' },
  { id: 'ai', label: 'Models & agents', icon: 'AI' },
];

const ALL_CATEGORIES = CATEGORY_META.map((c) => c.id);

type Settings = PublicRoom['settings'];

/** One-click match setups. Every field is set so a preset fully describes a match. */
const PRESETS: { id: string; icon: string; label: string; desc: string; settings: Settings }[] = [
  {
    id: 'quick',
    icon: '⚡',
    label: 'Quick',
    desc: '5 fast rounds',
    settings: { rounds: 5, roundTime: 15, categories: ALL_CATEGORIES, progressiveReveal: true, powerUps: false },
  },
  {
    id: 'classic',
    icon: '🎯',
    label: 'Classic',
    desc: '8 rounds, everything',
    settings: { rounds: 8, roundTime: 20, categories: ALL_CATEGORIES, progressiveReveal: true, powerUps: false },
  },
  {
    id: 'chaos',
    icon: '💥',
    label: 'Chaos',
    desc: 'Power-ups on',
    settings: { rounds: 10, roundTime: 20, categories: ALL_CATEGORIES, progressiveReveal: true, powerUps: true },
  },
  {
    id: 'code',
    icon: '</>',
    label: 'Code only',
    desc: 'Languages, frameworks, bugs',
    settings: { rounds: 8, roundTime: 25, categories: ['language', 'framework', 'bug'], progressiveReveal: true, powerUps: false },
  },
  {
    id: 'marathon',
    icon: '🏃',
    label: 'Marathon',
    desc: '20 relaxed rounds',
    settings: { rounds: 20, roundTime: 30, categories: ALL_CATEGORIES, progressiveReveal: false, powerUps: false },
  },
];

function matchesPreset(current: Settings, preset: Settings): boolean {
  return (
    current.rounds === preset.rounds &&
    current.roundTime === preset.roundTime &&
    current.progressiveReveal === preset.progressiveReveal &&
    current.powerUps === preset.powerUps &&
    current.categories.length === preset.categories.length &&
    preset.categories.every((c) => current.categories.includes(c))
  );
}

export default function Lobby({ room, playerId, onLeave }: Props) {
  const isHost = room.hostId === playerId;
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);
  const solo = room.players.length === 1;
  const soloBest = solo ? readStats().soloBestScore : 0;
  const activePreset = PRESETS.find((p) => matchesPreset(room.settings, p.settings));

  const updateSettings = (patch: Partial<Settings>) => {
    if (!isHost) return;
    socket.emit('room:settings', patch);
  };

  const toggleCategory = (cat: Category) => {
    const has = room.settings.categories.includes(cat);
    const next = has
      ? room.settings.categories.filter((c) => c !== cat)
      : [...room.settings.categories, cat];
    if (next.length === 0) return; // keep at least one
    updateSettings({ categories: next });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2500);
  };

  const copyHint =
    copyState === 'copied'
      ? '✓ Copied!'
      : copyState === 'failed'
        ? `Couldn't copy — just tell your friends: ${room.code}`
        : 'Click to copy · share this with friends to play together';

  return (
    <div className="lobby">
      <div className="card code-card">
        <div className="code-card-label">Room code</div>
        <button className="code-display" onClick={copyCode} title="Click to copy" aria-label={`Room code ${room.code}, click to copy`}>
          {room.code}
        </button>
        <div className={`code-hint ${copyState}`} role="status" aria-live="polite">{copyHint}</div>
      </div>

      <div className="lobby-grid">
        <div className="card players-card">
          <h3 className="card-title">Players · {room.players.length}</h3>
          <ul className="player-list">
            {room.players.map((p) => (
              <li key={p.id} className={`player-row ${p.id === playerId ? 'me' : ''}`}>
                <span className="avatar" style={{ background: avatarColor(p.name, p.color) }}>
                  {p.avatar || p.name.charAt(0).toUpperCase()}
                </span>
                <div className="player-id-col">
                  <span className="player-name">{p.name}{p.id === playerId ? ' (you)' : ''}</span>
                  {p.tagline && <span className="player-tagline">{p.tagline}</span>}
                </div>
                {p.favTech && <span className="tag fav-tech-tag">{p.favTech}</span>}
                {p.isHost && <span className="tag host-tag">Host</span>}
                {!p.connected && <span className="tag">offline</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="card settings-card">
          <h3 className="card-title">Match settings</h3>

          <div className="setting">
            <label>Quick setup</label>
            <div className="preset-row">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`preset ${activePreset?.id === p.id ? 'active' : ''}`}
                  disabled={!isHost}
                  aria-pressed={activePreset?.id === p.id}
                  onClick={() => updateSettings(p.settings)}
                >
                  <span className="preset-icon">{p.icon}</span>
                  <span className="preset-label">{p.label}</span>
                  <span className="preset-desc">{p.desc}</span>
                </button>
              ))}
            </div>
            <span className="setting-hint">
              {isHost
                ? activePreset
                  ? `${activePreset.label} match — tweak anything below to customize.`
                  : 'Custom match — pick a preset or keep tweaking below.'
                : `The host picks the match${activePreset ? `: ${activePreset.label}` : ' (custom)'}.`}
            </span>
          </div>

          <div className="setting">
            <label>Rounds: <strong>{room.settings.rounds}</strong></label>
            <input
              type="range"
              min={3}
              max={20}
              value={room.settings.rounds}
              disabled={!isHost}
              onChange={(e) => updateSettings({ rounds: Number(e.target.value) })}
            />
          </div>

          <div className="setting">
            <label>Seconds per round: <strong>{room.settings.roundTime}</strong></label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={room.settings.roundTime}
              disabled={!isHost}
              onChange={(e) => updateSettings({ roundTime: Number(e.target.value) })}
            />
          </div>

          <div className="setting">
            <label>Categories</label>
            <div className="category-toggle">
              {CATEGORY_META.map((c) => {
                const active = room.settings.categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className={`cat-chip ${active ? 'active' : ''}`}
                    disabled={!isHost}
                    onClick={() => toggleCategory(c.id)}
                  >
                    <span className="cat-icon">{c.icon}</span> {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting">
            <label>Progressive reveal</label>
            <button
              type="button"
              className={`toggle ${room.settings.progressiveReveal ? 'on' : ''}`}
              role="switch"
              aria-checked={room.settings.progressiveReveal}
              disabled={!isHost}
              onClick={() => updateSettings({ progressiveReveal: !room.settings.progressiveReveal })}
            >
              <span className="toggle-knob" />
              {room.settings.progressiveReveal ? 'On' : 'Off'}
            </button>
            <span className="setting-hint">
              Snippets &amp; logos start obscured and sharpen as the timer runs guess early for more points.
            </span>
          </div>

          <div className="setting">
            <label>Power-ups</label>
            <button
              type="button"
              className={`toggle ${room.settings.powerUps ? 'on' : ''}`}
              role="switch"
              aria-checked={room.settings.powerUps}
              disabled={!isHost}
              onClick={() => updateSettings({ powerUps: !room.settings.powerUps })}
            >
              <span className="toggle-knob" />
              {room.settings.powerUps ? 'On' : 'Off'}
            </button>
            <span className="setting-hint">
              Spend earned points mid-round on 50/50, a streak shield, or a smoke bomb that blurs rivals.
            </span>
          </div>
        </div>
      </div>

      <MiniGame />

      <div className="lobby-actions">
        {isHost ? (
          <button className="btn btn-primary big" onClick={() => socket.emit('game:start')}>
            {solo ? 'Start solo run ▶' : 'Start game ▶'}
          </button>
        ) : (
          <div className="waiting">Waiting for the host to start…</div>
        )}
        {isHost && solo && (
          <p className="solo-lobby-hint">
            🎯 {soloBest > 0 ? `Beat your solo best of ${soloBest}` : 'Set your first personal best'} —
            or share the code above to add friends.
          </p>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>Leave room</button>
      </div>
    </div>
  );
}
