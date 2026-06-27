import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A tiny, self-contained "Bug Squash" mini-game to pass the time in the lobby.
 * Purely client-side — it never touches the socket or the authoritative game
 * state. Tap the bugs before they scuttle away; the personal best is kept in
 * localStorage so there is a small reason to keep playing.
 */

const GRID = 9; // 3x3 board
const GAME_TIME = 20; // seconds per run
const BEST_KEY = 'devguessr:bugsquash:best';

type Status = 'idle' | 'playing' | 'over';

function readBest(): number {
  try {
    const n = parseInt(localStorage.getItem(BEST_KEY) ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    /* localStorage may be unavailable (private mode, etc.) */
  }
}

export default function MiniGame() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [best, setBest] = useState(readBest);
  const [active, setActive] = useState<Set<number>>(new Set());
  const [hit, setHit] = useState<number | null>(null);

  const spawnRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setActive(new Set());
    setHit(null);
    setStatus('playing');
  }, []);

  // Countdown timer.
  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // End the run when the clock hits zero and bank a new personal best.
  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    setStatus('over');
    setActive(new Set());
    setBest((b) => {
      const next = Math.max(b, score);
      if (next !== b) writeBest(next);
      return next;
    });
  }, [status, timeLeft, score]);

  // Spawn bugs on a shrinking interval — re-rolls which cells hold a bug.
  useEffect(() => {
    if (status !== 'playing') return;
    let alive = true;
    const spawn = () => {
      if (!alive) return;
      const count = 1 + (Math.random() < 0.4 ? 1 : 0);
      const cells = new Set<number>();
      while (cells.size < count) cells.add(Math.floor(Math.random() * GRID));
      setActive(cells);
      spawnRef.current = window.setTimeout(spawn, 600 + Math.random() * 350);
    };
    spawn();
    return () => {
      alive = false;
      if (spawnRef.current) window.clearTimeout(spawnRef.current);
    };
  }, [status]);

  const whack = (i: number) => {
    if (status !== 'playing' || !active.has(i)) return;
    setScore((s) => s + 1);
    setActive((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
    setHit(i);
    window.setTimeout(() => setHit((c) => (c === i ? null : c)), 180);
  };

  return (
    <div className="card minigame">
      <button
        className="minigame-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="minigame-title">🐛 Bug Squash</span>
        <span className="minigame-sub">
          {open ? 'A little something while you wait' : 'Tap to play while you wait'}
        </span>
        <span className="minigame-best">Best {best}</span>
        <span className={`minigame-caret ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="minigame-body">
          <div className="minigame-stats">
            <span className="mini-stat">
              <span className="mini-stat-label">Score</span>
              <strong>{score}</strong>
            </span>
            <span className="mini-stat">
              <span className="mini-stat-label">Time</span>
              <strong>{timeLeft}s</strong>
            </span>
            <span className="mini-stat">
              <span className="mini-stat-label">Best</span>
              <strong>{best}</strong>
            </span>
          </div>

          <div className={`bug-grid ${status === 'playing' ? 'live' : ''}`}>
            {Array.from({ length: GRID }, (_, i) => {
              const isActive = active.has(i);
              return (
                <button
                  key={i}
                  className={`bug-cell ${isActive ? 'has-bug' : ''} ${hit === i ? 'hit' : ''}`}
                  onClick={() => whack(i)}
                  disabled={status !== 'playing'}
                  aria-label={isActive ? 'Squash the bug' : 'Empty'}
                >
                  <span className="bug-emoji">{hit === i ? '💥' : isActive ? '🐛' : ''}</span>
                </button>
              );
            })}
          </div>

          <div className="minigame-actions">
            {status === 'idle' && (
              <button className="btn btn-primary" onClick={start}>Start ▶</button>
            )}
            {status === 'playing' && (
              <div className="minigame-msg">Squash as many bugs as you can!</div>
            )}
            {status === 'over' && (
              <>
                <div className="minigame-msg">
                  Time! You squashed <strong>{score}</strong>{' '}
                  {score === 1 ? 'bug' : 'bugs'}.
                </div>
                <button className="btn btn-primary" onClick={start}>Play again ↻</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
