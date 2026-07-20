import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { avatarColor } from '../profile';
import { socket } from '../socket';
import { play } from '../sound';
import type { PublicPlayer, PublicRoom } from '../types';
import SupportLink from './SupportLink';

/** Per-player summary of the game just finished, built in App from round results. */
export interface GameSummary {
  solo: boolean;
  score: number;
  correct: number;
  answered: number;
  bestStreak: number;
  newBestScore: boolean;
  newSoloBest: boolean;
  prevSoloBest: number;
}

interface Props {
  room: PublicRoom;
  playerId: string | null;
  leaderboard: PublicPlayer[];
  summary: GameSummary | null;
  onLeave: () => void;
}

/** Pick an upbeat headline for a solo run based on how accurate it was. */
function soloHeadline(accuracy: number, newBest: boolean): string {
  if (newBest) return '🎉 New personal best!';
  if (accuracy >= 100) return '🏆 Flawless run!';
  if (accuracy >= 80) return '🎯 Sharp eyes!';
  if (accuracy >= 50) return '👍 Nice run!';
  return '💪 Keep practicing!';
}

function SoloResults({ me, summary, onLeave }: { me: PublicPlayer; summary: GameSummary; onLeave: () => void }) {
  const { correct, answered, bestStreak, newSoloBest, prevSoloBest } = summary;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const goodRun = newSoloBest || accuracy >= 50;
  const toBeat = Math.max(0, prevSoloBest - me.score);

  useEffect(() => {
    play(goodRun ? 'win' : 'lose');
    if (!goodRun) return;
    const end = Date.now() + 1400;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, disableForReducedMotion: true });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="results solo-results">
      <h2 className="results-title">{soloHeadline(accuracy, newSoloBest)}</h2>

      <div className="solo-scorecard">
        <span className="solo-score-num">{me.score}</span>
        <span className="solo-score-label">points</span>
        {newSoloBest ? (
          <span className="solo-best-line best">Beat your previous best of {prevSoloBest}</span>
        ) : prevSoloBest > 0 ? (
          <span className="solo-best-line">
            Your best is {prevSoloBest}
            {toBeat > 0 ? ` · ${toBeat} more to beat it` : ''}
          </span>
        ) : (
          <span className="solo-best-line">Your first solo run is on the board!</span>
        )}
      </div>

      <div className="solo-stats">
        <div className="solo-stat">
          <span className="solo-stat-num">{accuracy}%</span>
          <span className="solo-stat-label">accuracy</span>
        </div>
        <div className="solo-stat">
          <span className="solo-stat-num">{correct}/{answered}</span>
          <span className="solo-stat-label">correct</span>
        </div>
        <div className="solo-stat">
          <span className="solo-stat-num">🔥 {bestStreak}</span>
          <span className="solo-stat-label">best streak</span>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn btn-primary big" onClick={() => socket.emit('game:restart')}>
          Play again ↻
        </button>
        <button className="btn btn-ghost" onClick={onLeave}>Back to home</button>
      </div>

      <SupportLink />
    </div>
  );
}

export default function Results({ room, playerId, leaderboard, summary, onLeave }: Props) {
  const isHost = room.hostId === playerId;
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const me = sorted.find((p) => p.id === playerId);
  const myRank = me ? sorted.indexOf(me) + 1 : null;
  const iWon = winner?.id === playerId;
  const isSolo = summary?.solo ?? sorted.length === 1;

  // Solo runs get their own celebration focused on personal records, not a podium.
  if (isSolo && me && summary) {
    return <SoloResults me={me} summary={summary} onLeave={onLeave} />;
  }

  return (
    <MultiplayerResults
      sorted={sorted}
      winner={winner}
      me={me}
      myRank={myRank}
      iWon={iWon}
      playerId={playerId}
      isHost={isHost}
      onLeave={onLeave}
    />
  );
}

function MultiplayerResults({
  sorted,
  winner,
  me,
  myRank,
  iWon,
  playerId,
  isHost,
  onLeave,
}: {
  sorted: PublicPlayer[];
  winner: PublicPlayer | undefined;
  me: PublicPlayer | undefined;
  myRank: number | null;
  iWon: boolean;
  playerId: string | null;
  isHost: boolean;
  onLeave: () => void;
}) {
  useEffect(() => {
    play(iWon ? 'win' : 'lose');
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
