import confetti from 'canvas-confetti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { socket } from '../socket';
import type { Category, PublicRoom, RoundResultPayload, RoundStartPayload } from '../types';

interface Props {
  room: PublicRoom;
  playerId: string | null;
  round: RoundStartPayload | null;
  result: RoundResultPayload | null;
}

const CATEGORY_LABEL: Record<Category, string> = {
  language: 'Guess the language',
  framework: 'Guess the framework',
  company: 'Guess the company',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function Game({ room, playerId, round, result }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const confettiFired = useRef<string | null>(null);

  const question = round?.question ?? null;

  // Reset the local selection whenever a new round begins.
  useEffect(() => {
    setSelected(null);
    setNow(Date.now());
    confettiFired.current = null;
  }, [round?.index]);

  // Tick the countdown until the round is revealed.
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [result]);

  // Celebrate a correct answer once per round.
  useEffect(() => {
    if (!result || !playerId || !question) return;
    const mine = result.results[playerId];
    if (mine?.correct && confettiFired.current !== question.id) {
      confettiFired.current = question.id;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true });
    }
  }, [result, playerId, question]);

  const me = useMemo(() => room.players.find((p) => p.id === playerId), [room.players, playerId]);
  const answered = me?.answered ?? selected !== null;

  if (!round || !question) {
    return <div className="game"><div className="loading">Loading round…</div></div>;
  }

  const total = room.settings.roundTime * 1000;
  const remaining = result ? 0 : Math.max(0, round.endsAt - now);
  const secondsLeft = Math.ceil(remaining / 1000);
  const progress = result ? 0 : Math.max(0, Math.min(1, remaining / total));

  // Progressive reveal: obscure the stage early in the round (when enabled),
  // sharpening to fully clear by roughly the half-way mark so early guesses are
  // riskier but worth more points. Clears once the player has locked in.
  const obscure =
    room.settings.progressiveReveal && !result && !answered
      ? Math.max(0, Math.min(1, (progress - 0.5) / 0.5))
      : 0;
  const codeBlur = obscure * 6;

  const pick = (i: number) => {
    if (answered || result) return;
    setSelected(i);
    socket.emit('answer:submit', { choice: i });
  };

  const optionState = (i: number): 'idle' | 'selected' | 'correct' | 'wrong' => {
    if (result) {
      if (i === result.correctIndex) return 'correct';
      if (i === selected) return 'wrong';
      return 'idle';
    }
    return i === selected ? 'selected' : 'idle';
  };

  const answeredCount = room.players.filter((p) => p.answered).length;

  return (
    <div className="game">
      <div className="game-main">
        <div className="round-bar">
          <span className={`cat-badge cat-${question.category}`}>
            {CATEGORY_LABEL[question.category]}
          </span>
          <span className="round-count">
            Round {round.index + 1} / {round.total}
          </span>
          <span className={`timer ${secondsLeft <= 5 && !result ? 'urgent' : ''}`}>
            {result ? '⏱' : `${secondsLeft}s`}
          </span>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="stage">
          {question.type === 'code' ? (
            <SyntaxHighlighter
              language={question.highlight || 'text'}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 14,
                padding: '1.25rem 1.5rem',
                fontSize: '0.95rem',
                background: '#1c160f',
                maxHeight: '46vh',
                filter: codeBlur ? `blur(${codeBlur.toFixed(1)}px)` : undefined,
                transition: 'filter 0.18s linear',
              }}
              wrapLongLines
            >
              {question.code ?? ''}
            </SyntaxHighlighter>
          ) : (
            <LogoStage
              slug={question.slug ?? ''}
              revealed={!!result}
              color={question.color ?? '#f6ecdd'}
              obscure={obscure}
            />
          )}
        </div>

        <div className="options">
          {question.options.map((opt, i) => {
            const state = optionState(i);
            return (
              <button
                key={opt}
                className={`option option-${state}`}
                disabled={answered || !!result}
                onClick={() => pick(i)}
              >
                <span className="option-key">{OPTION_KEYS[i]}</span>
                <span className="option-label">{opt}</span>
                {state === 'correct' && <span className="option-mark">✓</span>}
                {state === 'wrong' && <span className="option-mark">✕</span>}
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="reveal-bar">
            <div className="reveal-answer">
              Answer: <strong>{result.answer}</strong>
              {playerId && result.results[playerId]?.correct ? (
                <span className="reveal-points">+{result.results[playerId].points}</span>
              ) : (
                <span className="reveal-miss">no points</span>
              )}
            </div>
            {result.fact && <div className="reveal-fact">💡 {result.fact}</div>}
            <div className="reveal-next">Next round starting…</div>
          </div>
        ) : (
          <div className="answer-status">
            {answered ? 'Locked in! Waiting for others…' : 'Pick your answer ⤴'}
            <span className="answered-count">{answeredCount}/{room.players.length} answered</span>
          </div>
        )}
      </div>

      <aside className="scoreboard">
        <h3 className="card-title">Live standings</h3>
        <ul className="score-list">
          {room.players.map((p, rank) => (
            <li key={p.id} className={`score-row ${p.id === playerId ? 'me' : ''}`}>
              <span className="score-rank">{rank + 1}</span>
              <span className="score-name">
                {p.name}
                {p.streak >= 2 && <span className="streak" title={`${p.streak} in a row`}>🔥{p.streak}</span>}
              </span>
              <span className="score-pts">
                {p.score}
                {result && p.lastPoints > 0 && <span className="score-delta">+{p.lastPoints}</span>}
                {!result && p.answered && <span className="answered-dot" title="answered">●</span>}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function LogoStage({ slug, revealed, color, obscure }: { slug: string; revealed: boolean; color: string; obscure: number }) {
  // During play the logo is shown as a neutral silhouette; the real brand
  // color is revealed once the round ends. With progressive reveal enabled it
  // also starts zoomed-in and blurred, easing out as the timer runs.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [slug]);

  const hex = (revealed ? color : '#c2b4a0').replace('#', '');
  const src = `https://cdn.simpleicons.org/${slug}/${hex}`;
  const obscureStyle =
    obscure > 0
      ? { filter: `blur(${(obscure * 12).toFixed(1)}px)`, transform: `scale(${(1 + obscure * 0.7).toFixed(2)})` }
      : undefined;
  return (
    <div className={`logo-stage ${revealed ? 'revealed' : ''}`}>
      {failed ? (
        <div className="logo-fallback" role="img" aria-label="Logo unavailable">?</div>
      ) : (
        <img
          src={src}
          alt="Mystery brand logo"
          className="logo-img"
          draggable={false}
          style={obscureStyle}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
