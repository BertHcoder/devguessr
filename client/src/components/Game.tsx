import confetti from 'canvas-confetti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { avatarColor } from '../profile';
import { socket } from '../socket';
import { play } from '../sound';
import type { Category, PublicRoom, RoundResultPayload, RoundStartPayload } from '../types';

interface Props {
  room: PublicRoom;
  playerId: string | null;
  round: RoundStartPayload | null;
  result: RoundResultPayload | null;
  onLeave: () => void;
}

const CATEGORY_LABEL: Record<Category, string> = {
  language: 'Guess the language',
  framework: 'Guess the framework',
  company: 'Guess the company',
  bug: 'Spot the bug',
  funny: 'Name the ritual',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Optional power-ups. Costs mirror POWERUP_COSTS on the server. */
const POWERUPS = [
  { type: 'fifty' as const, icon: '½', label: '50/50', cost: 120, preAnswer: true, desc: 'Remove two wrong options' },
  { type: 'shield' as const, icon: '🛡', label: 'Shield', cost: 175, preAnswer: true, desc: 'Protect your streak from one miss' },
  { type: 'double' as const, icon: '⚡', label: 'Double', cost: 250, preAnswer: true, desc: '2× points this round if correct' },
  { type: 'freeze' as const, icon: '🧊', label: 'Freeze', cost: 150, preAnswer: true, desc: 'Add 5 seconds to the clock' },
  { type: 'spy' as const, icon: '👁', label: 'Spy', cost: 175, preAnswer: false, desc: 'See how many players picked each option' },
  { type: 'smoke' as const, icon: '💨', label: 'Smoke', cost: 200, preAnswer: false, desc: "Blur every rival's screen" },
];

/** Confirmation shown to the activating player the moment a power-up fires. */
const POWERUP_FLASH: Record<'fifty' | 'shield' | 'smoke' | 'double' | 'freeze' | 'spy', { icon: string; text: string }> = {
  fifty: { icon: '½', text: '50/50 — two wrong answers removed' },
  shield: { icon: '🛡', text: 'Shield armed — your streak is protected' },
  smoke: { icon: '💨', text: 'Smoke bomb deployed on your rivals!' },
  double: { icon: '⚡', text: 'Double Down — 2× points if you nail it!' },
  freeze: { icon: '🧊', text: 'Time frozen — +5 seconds on the clock!' },
  spy: { icon: '👁', text: 'Spy intel incoming…' },
};

export default function Game({ room, playerId, round, result, onLeave }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hidden, setHidden] = useState<number[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [smokeUntil, setSmokeUntil] = useState(0);
  const [smokeFrom, setSmokeFrom] = useState('');
  const [spyCounts, setSpyCounts] = useState<number[] | null>(null);
  // A short-lived confirmation banner shown when this player fires a power-up.
  const [flash, setFlash] = useState<{ icon: string; text: string } | null>(null);
  const flashTimer = useRef<number | null>(null);
  const confettiFired = useRef<string | null>(null);
  // Tracks the last whole second we played a countdown tick for, so each of the
  // final seconds beeps exactly once.
  const lastTickRef = useRef<number | null>(null);
  // Locks the answer the instant it is sent. `selected` (React state) updates
  // asynchronously, so without this a fast second click could slip past the
  // `answered` guard and overwrite the choice before the buttons disable.
  const submittedRef = useRef(false);

  const question = round?.question ?? null;

  // Reset the local selection whenever a new round begins.
  useEffect(() => {
    setSelected(null);
    setNow(Date.now());
    setHidden([]);
    setUsed([]);
    setSmokeUntil(0);
    setSpyCounts(null);
    setFlash(null);
    confettiFired.current = null;
    submittedRef.current = false;
    lastTickRef.current = null;
    if (round) play('roundStart');
  }, [round?.index]);

  // React to a rival's smoke bomb: blur our own stage for a few seconds.
  useEffect(() => {
    const onSmoked = (p: { fromName: string; durationMs: number }) => {
      setSmokeFrom(p.fromName);
      setSmokeUntil(Date.now() + p.durationMs);
      play('wrong');
    };
    const onTimeExtended = (p: { endsAt: number }) => {
      if (round) round.endsAt = p.endsAt;
    };
    socket.on('powerup:smoked', onSmoked);
    socket.on('round:timeExtended', onTimeExtended);
    return () => {
      socket.off('powerup:smoked', onSmoked);
      socket.off('round:timeExtended', onTimeExtended);
    };
  }, [round]);

  // Clear any pending power-up flash timer when the component unmounts.
  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );

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
    if (confettiFired.current === question.id) return;
    confettiFired.current = question.id;
    if (mine?.correct) {
      play('correct');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true });
    } else {
      play('wrong');
    }
  }, [result, playerId, question]);

  // Beep on each of the final few seconds while the round is still live.
  useEffect(() => {
    if (result || !round) return;
    const secs = Math.ceil(Math.max(0, round.endsAt - now) / 1000);
    if (secs > 0 && secs <= 5 && lastTickRef.current !== secs) {
      lastTickRef.current = secs;
      play('tick');
    }
  }, [now, result, round]);

  const me = useMemo(() => room.players.find((p) => p.id === playerId), [room.players, playerId]);
  const answered = me?.answered ?? selected !== null;
  const isHost = room.hostId === playerId;

  // Host: abandon the current game and send everyone back to the lobby (e.g. to
  // fix the settings). Reuses the same server reset as "play again".
  const backToLobby = () => {
    if (window.confirm('End this game and send everyone back to the lobby?')) {
      socket.emit('game:restart');
    }
  };

  // Any player: leave the game entirely and return to the home screen.
  const leaveGame = () => {
    if (window.confirm('Leave the game and return home?')) onLeave();
  };

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

  // Power-ups: when sabotaged by a rival's smoke bomb our stage blurs and
  // shakes for a few seconds, on top of any progressive-reveal blur.
  const powerUps = room.settings.powerUps;
  const smoked = !result && now < smokeUntil;
  const codeFilter = codeBlur + (smoked ? 7 : 0);

  // "Spot the bug" rounds number every line and highlight the culprit on reveal.
  const isBug = question.category === 'bug';
  const revealedBugLine =
    isBug && result ? Number(String(result.answer).replace(/\D+/g, '')) || null : null;

  const pick = (i: number) => {
    if (submittedRef.current || answered || result) return;
    submittedRef.current = true;
    play('click');
    setSelected(i);
    socket.emit('answer:submit', { choice: i });
  };

  const buyPowerup = (type: 'fifty' | 'shield' | 'smoke' | 'double' | 'freeze' | 'spy') => {
    if (used.includes(type)) return;
    socket.emit(
      'powerup:use',
      { type },
      (res: { ok: boolean; type?: string; hiddenIndices?: number[]; newEndsAt?: number; optionCounts?: number[] }) => {
        if (!res?.ok) return;
        setUsed((u) => (u.includes(type) ? u : [...u, type]));
        if (type === 'fifty' && res.hiddenIndices) setHidden(res.hiddenIndices);
        if (type === 'spy' && res.optionCounts) setSpyCounts(res.optionCounts);
        play('powerup');
        const fb = POWERUP_FLASH[type];
        setFlash(fb);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(null), 2600);
      },
    );
  };

  // The option this player actually locked in. After the reveal we trust the
  // server-recorded choice so the highlight always matches what was scored —
  // a local `selected` can diverge if a stray click lands or the pick arrives
  // just as the round ends (in which case the server records no answer).
  const myChoice =
    result && playerId ? result.results[playerId]?.choice ?? null : selected;

  const optionState = (i: number): 'idle' | 'selected' | 'correct' | 'wrong' => {
    if (result) {
      if (i === result.correctIndex) return 'correct';
      if (i === myChoice) return 'wrong';
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
          <div className="game-controls">
            {isHost && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={backToLobby}
                title="End the game and send everyone back to the lobby"
              >
                ⏮ Lobby
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={leaveGame}
              title="Leave the game and return home"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {smoked && (
          <div className="smoke-banner">💨 {smokeFrom || 'A rival'} set off a smoke bomb!</div>
        )}

        {flash && (
          <div className="powerup-flash" role="status" aria-live="polite">
            <span className="pf-icon">{flash.icon}</span>
            <span className="pf-text">{flash.text}</span>
          </div>
        )}

        <div className={`stage ${smoked ? 'smoked' : ''}`}>
          {question.type === 'code' ? (
            <SyntaxHighlighter
              language={question.highlight || 'text'}
              style={oneDark}
              showLineNumbers={isBug}
              wrapLines={isBug}
              lineProps={(lineNumber: number) =>
                revealedBugLine && lineNumber === revealedBugLine
                  ? { style: { display: 'block', background: 'rgba(242, 88, 78, 0.25)' } }
                  : {}
              }
              customStyle={{
                margin: 0,
                borderRadius: 14,
                padding: '1.25rem 1.5rem',
                fontSize: '0.95rem',
                background: '#1c160f',
                maxHeight: '46vh',
                filter: codeFilter ? `blur(${codeFilter.toFixed(1)}px)` : undefined,
                transition: 'filter 0.18s linear',
              }}
              wrapLongLines={!isBug}
            >
              {question.code ?? ''}
            </SyntaxHighlighter>
          ) : question.type === 'text' ? (
            <TextStage prompt={question.prompt} blur={codeFilter} />
          ) : (
            <LogoStage
              slug={question.slug ?? ''}
              revealed={!!result}
              color={question.color ?? '#f6ecdd'}
              obscure={obscure}
              extraBlur={smoked ? 7 : 0}
            />
          )}
        </div>

        {powerUps && !result && (
          <div className="powerups">
            {POWERUPS.map((pu) => {
              const isUsed = used.includes(pu.type);
              const disabled = isUsed || (me?.score ?? 0) < pu.cost || (pu.preAnswer && answered);
              return (
                <button
                  key={pu.type}
                  className={`powerup ${isUsed ? 'used' : ''}`}
                  disabled={disabled}
                  onClick={() => buyPowerup(pu.type)}
                  title={pu.desc}
                >
                  <span className="pu-icon">{pu.icon}</span>
                  <span className="pu-label">{pu.label}</span>
                  {isUsed ? (
                    <span className="pu-active">✓ active</span>
                  ) : (
                    <span className="pu-cost">−{pu.cost}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="options">
          {question.options.map((opt, i) => {
            const state = optionState(i);
            const eliminated = !result && hidden.includes(i);
            return (
              <button
                key={opt}
                className={`option option-${state} ${eliminated ? 'option-eliminated' : ''}`}
                disabled={answered || !!result || eliminated}
                onClick={() => pick(i)}
              >
                <span className="option-key">{OPTION_KEYS[i]}</span>
                <span className="option-label">{opt}</span>
                {spyCounts && !result && (
                  <span className="option-spy" title={`${spyCounts[i]} player(s) picked this`}>
                    👁 {spyCounts[i]}
                  </span>
                )}
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
              <span className="avatar avatar-sm" style={{ background: avatarColor(p.name, p.color) }}>
                {p.avatar || p.name.charAt(0).toUpperCase()}
              </span>
              <span className="score-name">
                {p.name}
                {p.streak >= 2 && <span className="streak" title={`${p.streak} in a row`}>🔥{p.streak}</span>}
                {p.shield && <span className="shield-badge" title="Streak shield active">🛡</span>}
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

function TextStage({ prompt, blur = 0 }: { prompt: string; blur?: number }) {
  // "Funny" rounds show a snarky description; the player names the ritual.
  // Progressive reveal / smoke blurs the text just like a code snippet.
  return (
    <div className="text-stage">
      <span className="text-stage-quote">“</span>
      <p
        className="text-stage-prompt"
        style={{
          filter: blur ? `blur(${blur.toFixed(1)}px)` : undefined,
          transition: 'filter 0.18s linear',
        }}
      >
        {prompt}
      </p>
    </div>
  );
}

function LogoStage({ slug, revealed, color, obscure, extraBlur = 0 }: { slug: string; revealed: boolean; color: string; obscure: number; extraBlur?: number }) {
  // During play the logo is shown as a neutral silhouette; the real brand
  // color is revealed once the round ends. With progressive reveal enabled it
  // also starts zoomed-in and blurred, easing out as the timer runs.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [slug]);

  const hex = (revealed ? color : '#c2b4a0').replace('#', '');
  const src = `https://cdn.simpleicons.org/${slug}/${hex}`;
  const totalBlur = obscure * 12 + extraBlur;
  const obscureStyle =
    totalBlur > 0
      ? { filter: `blur(${totalBlur.toFixed(1)}px)`, transform: `scale(${(1 + obscure * 0.7).toFixed(2)})` }
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
