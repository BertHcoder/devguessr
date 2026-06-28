import { useState } from 'react';
import { avatarColor } from '../profile';
import { socket } from '../socket';
import type { PlayerProfile } from '../types';
import SupportLink from './SupportLink';
import RepoLink from './RepoLink';

interface Props {
  connected: boolean;
  onJoined: (playerId: string) => void;
  profile: PlayerProfile;
  onProfileChange: (profile: PlayerProfile) => void;
  onEditProfile: () => void;
}

type AckResponse = { ok: boolean; code?: string; playerId?: string; error?: string };

export default function Home({
  connected,
  onJoined,
  profile,
  onProfileChange,
  onEditProfile,
}: Props) {
  const name = profile.name;
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rememberName = (value: string) => {
    onProfileChange({ ...profile, name: value });
  };

  const handleAck = (res: AckResponse) => {
    setBusy(false);
    if (res.ok && res.playerId) {
      onJoined(res.playerId);
    } else {
      setError(res.error ?? 'Something went wrong.');
    }
  };

  const create = () => {
    if (!name.trim()) return setError('Enter a display name first.');
    setError(null);
    setBusy(true);
    socket.emit('room:create', { name: name.trim(), profile }, handleAck);
  };

  const join = () => {
    if (!name.trim()) return setError('Enter a display name first.');
    if (joinCode.trim().length < 4) return setError('Enter a 4-letter room code.');
    setError(null);
    setBusy(true);
    socket.emit(
      'room:join',
      { name: name.trim(), code: joinCode.trim().toUpperCase(), profile },
      handleAck,
    );
  };

  return (
    <div className="home">
      <div className="hero">
        <h1 className="hero-title">
          Dev<span className="accent">Guessr</span>
        </h1>
        <p className="hero-sub">
          A GeoGuessr for engineers. Spot the <strong>language</strong>, name the{' '}
          <strong>framework</strong>, unmask the <strong>company</strong>, and call out the{' '}
          <strong>meeting</strong> faster than your friends.
        </p>
        <div className="hero-pills">
          <span className="pill pill-language">{'</> language'}</span>
          <span className="pill pill-framework">⚙ framework</span>
          <span className="pill pill-company">★ company</span>
          <span className="pill pill-bug">🐛 spot the bug</span>
          <span className="pill pill-funny">🎭 name the ritual</span>
        </div>
      </div>

      <div className="card join-card">
        <label className="field">
          <span>Display name</span>
          <div className="name-row">
            <span
              className="avatar"
              style={{ background: avatarColor(name, profile.color) }}
              aria-hidden="true"
            >
              {profile.avatar || (name.trim().charAt(0) || '?').toUpperCase()}
            </span>
            <input
              value={name}
              maxLength={20}
              placeholder="e.g. ada_lovelace"
              onChange={(e) => rememberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
          </div>
        </label>

        <button type="button" className="btn btn-ghost customize-btn" onClick={onEditProfile}>
          ✨ Customize profile
        </button>

        <button className="btn btn-primary big" disabled={busy || !connected} onClick={create}>
          Create a room
        </button>

        <div className="divider"><span>or join one</span></div>

        <div className="join-row">
          <input
            className="code-input"
            value={joinCode}
            maxLength={4}
            placeholder="CODE"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && join()}
          />
          <button className="btn btn-ghost" disabled={busy || !connected} onClick={join}>
            Join
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {!connected && <p className="hint">Connecting to the game server…</p>}
      </div>

      <p className="footnote">
        Play solo to practice, or share your room code and battle live.
      </p>

      <div className="link-row">
        <RepoLink />
        <SupportLink />
      </div>
    </div>
  );
}
