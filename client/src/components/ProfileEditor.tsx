import { useState } from 'react';
import { AVATAR_EMOJIS, COLOR_SWATCHES, avatarColor, readStats } from '../profile';
import type { PlayerProfile } from '../types';

interface Props {
  initial: PlayerProfile;
  onClose: () => void;
  onSave: (profile: PlayerProfile) => void;
}

export default function ProfileEditor({ initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<PlayerProfile>(initial);
  const stats = readStats();

  const set = (patch: Partial<PlayerProfile>) => setDraft((d) => ({ ...d, ...patch }));
  const initialChar = (draft.name.trim().charAt(0) || '?').toUpperCase();

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Edit your profile"
      onClick={onClose}
    >
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Your profile</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="profile-preview">
          <span
            className="avatar avatar-lg"
            style={{ background: avatarColor(draft.name, draft.color) }}
          >
            {draft.avatar || initialChar}
          </span>
          <div className="profile-preview-meta">
            <strong>{draft.name.trim() || 'Anonymous dev'}</strong>
            {draft.favTech && <span className="tag fav-tech-tag">{draft.favTech}</span>}
            {draft.tagline && <span className="player-tagline">{draft.tagline}</span>}
          </div>
        </div>

        <label className="field">
          <span>Display name</span>
          <input
            value={draft.name}
            maxLength={20}
            placeholder="e.g. ada_lovelace"
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>

        <div className="field">
          <span>Avatar</span>
          <div className="emoji-grid">
            <button
              type="button"
              className={`emoji-btn ${draft.avatar === '' ? 'active' : ''}`}
              onClick={() => set({ avatar: '' })}
              title="Use your initial"
            >
              {initialChar}
            </button>
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-btn ${draft.avatar === emoji ? 'active' : ''}`}
                onClick={() => set({ avatar: emoji })}
                aria-label={`Avatar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Favorite tech</span>
          <input
            value={draft.favTech}
            maxLength={20}
            placeholder="e.g. Rust, React, Postgres"
            onChange={(e) => set({ favTech: e.target.value })}
          />
        </label>

        <div className="field">
          <span>Accent color</span>
          <div className="swatch-row">
            <button
              type="button"
              className={`swatch swatch-auto ${draft.color === '' ? 'active' : ''}`}
              onClick={() => set({ color: '' })}
              title="Auto (from name)"
            >
              A
            </button>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch ${draft.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => set({ color: c })}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <label className="field">
          <span>Tagline</span>
          <input
            value={draft.tagline}
            maxLength={40}
            placeholder="e.g. just here for the bugs"
            onChange={(e) => set({ tagline: e.target.value })}
          />
        </label>

        <div className="profile-stats">
          <div className="stat">
            <span className="stat-num">{stats.gamesPlayed}</span>
            <span className="stat-label">games</span>
          </div>
          <div className="stat">
            <span className="stat-num">{stats.bestScore}</span>
            <span className="stat-label">best</span>
          </div>
          <div className="stat">
            <span className="stat-num">{stats.wins}</span>
            <span className="stat-label">wins</span>
          </div>
          <div className="stat">
            <span className="stat-num">{stats.podiums}</span>
            <span className="stat-label">podiums</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onSave(draft)}>
            Save profile
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
