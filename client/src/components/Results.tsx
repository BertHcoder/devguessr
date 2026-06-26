import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { avatarColor } from '../profile';
import { socket } from '../socket';
import type { PublicPlayer, PublicRoom } from '../types';
import SupportLink from './SupportLink';

interface Props {
  room: PublicRoom;
  playerId: string | null;
  leaderboard: PublicPlayer[];
  onLeave: () => void;
}

export default function Results({ room, playerId, leaderboard, onLeave }: Props) {
  const isHost = room.hostId === playerId;
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const me = sorted.find((p) => p.id === playerId);
  const myRank = me ? sorted.indexOf(me) + 1 : null;
  const iWon = winner?.id === playerId;

  useEffect(() => {
    const duration = 1400;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, disableForReducedMotion: true });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const podium = sorted.slice(0, 3);
  const order = [1, 0, 2]; // render 2nd, 1st, 3rd for a centered podium

  return (
    <div className="results">
      <h2 className="results-title">
        {iWon ? '🏆 You win!' : winner ? `🏆 ${winner.name} wins!` : 'Game over'}
      </h2>
      {myRank && (
        <p className="results-sub">
          You finished <strong>#{myRank}</strong> with <strong>{me?.score ?? 0}</strong> points.
        </p>
      )}

      <div className="podium">
        {order
          .filter((i) => podium[i])
          .map((i) => {
            const p = podium[i];
            const place = i + 1;
            return (
              <div key={p.id} className={`podium-col place-${place}`}>
                <div className="podium-avatar" style={{ background: avatarColor(p.name, p.color) }}>
                  {p.avatar || p.name.charAt(0).toUpperCase()}
                </div>
                <div className="podium-name">{p.name}{p.id === playerId ? ' (you)' : ''}</div>
                {p.favTech && <div className="podium-tech">{p.favTech}</div>}
                <div className="podium-score">{p.score}</div>
                <div className="podium-block">
                  <span className="podium-medal">{['🥇', '🥈', '🥉'][i]}</span>
                  <span className="podium-place">#{place}</span>
                </div>
              </div>
            );
          })}
      </div>

      {sorted.length > 3 && (
        <ul className="rest-list">
          {sorted.slice(3).map((p, idx) => (
            <li key={p.id} className={`rest-row ${p.id === playerId ? 'me' : ''}`}>
              <span className="rest-rank">#{idx + 4}</span>
              <span className="avatar avatar-sm" style={{ background: avatarColor(p.name, p.color) }}>
                {p.avatar || p.name.charAt(0).toUpperCase()}
              </span>
              <span className="rest-name">
                {p.name}
                {p.favTech && <span className="tag fav-tech-tag">{p.favTech}</span>}
              </span>
              <span className="rest-score">{p.score}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="results-actions">
        {isHost ? (
          <button className="btn btn-primary big" onClick={() => socket.emit('game:restart')}>
            Play again ↻
          </button>
        ) : (
          <div className="waiting">Waiting for the host to start a new game…</div>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>Back to home</button>
      </div>

      <SupportLink />
    </div>
  );
}
