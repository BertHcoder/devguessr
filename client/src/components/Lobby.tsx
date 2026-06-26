import { useState } from 'react';
import { socket } from '../socket';
import type { Category, PublicRoom } from '../types';

interface Props {
  room: PublicRoom;
  playerId: string | null;
  onLeave: () => void;
}

const CATEGORY_META: { id: Category; label: string; icon: string }[] = [
  { id: 'language', label: 'Languages', icon: '</>' },
  { id: 'framework', label: 'Frameworks', icon: '⚙' },
  { id: 'company', label: 'Companies', icon: '★' },
];

export default function Lobby({ room, playerId, onLeave }: Props) {
  const isHost = room.hostId === playerId;
  const [copied, setCopied] = useState(false);

  const updateSettings = (patch: Partial<PublicRoom['settings']>) => {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="lobby">
      <div className="card code-card">
        <div className="code-card-label">Room code</div>
        <button className="code-display" onClick={copyCode} title="Click to copy">
          {room.code}
        </button>
        <div className="code-hint">{copied ? 'Copied!' : 'Share this with friends to play together'}</div>
      </div>

      <div className="lobby-grid">
        <div className="card players-card">
          <h3 className="card-title">Players · {room.players.length}</h3>
          <ul className="player-list">
            {room.players.map((p) => (
              <li key={p.id} className={`player-row ${p.id === playerId ? 'me' : ''}`}>
                <span className="avatar" style={{ background: avatarColor(p.name) }}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="player-name">{p.name}{p.id === playerId ? ' (you)' : ''}</span>
                {p.isHost && <span className="tag host-tag">Host</span>}
                {!p.connected && <span className="tag">offline</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="card settings-card">
          <h3 className="card-title">Match settings</h3>

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
              min={10}
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
              Snippets &amp; logos start obscured and sharpen as the timer runs — guess early for more points.
            </span>
          </div>
        </div>
      </div>

      <div className="lobby-actions">
        {isHost ? (
          <button className="btn btn-primary big" onClick={() => socket.emit('game:start')}>
            Start game ▶
          </button>
        ) : (
          <div className="waiting">Waiting for the host to start…</div>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>Leave room</button>
      </div>
    </div>
  );
}

function avatarColor(name: string): string {
  const palette = [
    '#ff6a3d', '#f5a623', '#27cdb0', '#ff6f9d', '#45cf8a',
    '#ff9d3c', '#e8c14b', '#f2584e', '#2f9e8f', '#d98344',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
