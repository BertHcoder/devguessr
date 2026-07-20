import { useEffect, useRef, useState } from 'react';
import Game from './components/Game';
import Home from './components/Home';
import Lobby from './components/Lobby';
import ProfileEditor from './components/ProfileEditor';
import Results, { type GameSummary } from './components/Results';
import SoundControl from './components/SoundControl';
import ThemePicker from './components/ThemePicker';
import { avatarColor, readProfile, recordGameResult, saveProfile } from './profile';
import { socket } from './socket';
import type {
  GameOverPayload,
  PlayerProfile,
  PublicPlayer,
  PublicRoom,
  RoundResultPayload,
  RoundStartPayload,
} from './types';

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [round, setRound] = useState<RoundStartPayload | null>(null);
  const [result, setResult] = useState<RoundResultPayload | null>(null);
  const [finalBoard, setFinalBoard] = useState<PublicPlayer[] | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [profile, setProfile] = useState<PlayerProfile>(() => readProfile());
  const [editorOpen, setEditorOpen] = useState(false);

  // Per-game accumulators (this player only) used to build the end-of-game summary.
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const bestStreakRef = useRef(0);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setPlayerId(socket.id ?? null);
    };
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (r: PublicRoom) => {
      setRoom(r);
      if (r.status === 'lobby') {
        setRound(null);
        setResult(null);
        setFinalBoard(null);
        setSummary(null);
      }
    };
    const onRoundStart = (p: RoundStartPayload) => {
      // A fresh game starts at round 0 — reset this player's running tally.
      if (p.index === 0) {
        correctRef.current = 0;
        answeredRef.current = 0;
        bestStreakRef.current = 0;
      }
      setRound(p);
      setResult(null);
      setFinalBoard(null);
      setSummary(null);
    };
    const onRoundResult = (p: RoundResultPayload) => {
      setResult(p);
      const myId = socket.id;
      const mine = myId ? p.results[myId] : undefined;
      if (mine) {
        answeredRef.current += 1;
        if (mine.correct) correctRef.current += 1;
      }
      const me = p.leaderboard.find((pl) => pl.id === myId);
      if (me && me.streak > bestStreakRef.current) bestStreakRef.current = me.streak;
    };
    const onGameOver = (p: GameOverPayload) => {
      setFinalBoard(p.leaderboard);
      const myId = socket.id;
      const sorted = [...p.leaderboard].sort((a, b) => b.score - a.score);
      const idx = sorted.findIndex((pl) => pl.id === myId);
      if (idx < 0) return;
      const score = sorted[idx].score;
      const totalPlayers = sorted.length;
      const rec = recordGameResult({
        score,
        rank: idx + 1,
        totalPlayers,
        bestStreak: bestStreakRef.current,
      });
      setSummary({
        solo: totalPlayers <= 1,
        score,
        correct: correctRef.current,
        answered: answeredRef.current,
        bestStreak: bestStreakRef.current,
        newBestScore: rec.newBestScore,
        newSoloBest: rec.newSoloBest,
        prevSoloBest: rec.prevSoloBest,
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:update', onRoomUpdate);
    socket.on('round:start', onRoundStart);
    socket.on('round:result', onRoundResult);
    socket.on('game:over', onGameOver);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:update', onRoomUpdate);
      socket.off('round:start', onRoundStart);
      socket.off('round:result', onRoundResult);
      socket.off('game:over', onGameOver);
    };
  }, []);

  const leaveRoom = () => {
    socket.emit('room:leave');
    setRoom(null);
    setRound(null);
    setResult(null);
    setFinalBoard(null);
    setSummary(null);
  };

  const commitProfile = (next: PlayerProfile) => {
    const clean = saveProfile(next);
    setProfile(clean);
    // If we're already in a room, let everyone see the change.
    if (room) socket.emit('profile:update', clean);
  };

  let view;
  if (!room) {
    view = (
      <Home
        onJoined={(id) => setPlayerId(id)}
        connected={connected}
        profile={profile}
        onProfileChange={commitProfile}
        onEditProfile={() => setEditorOpen(true)}
      />
    );
  } else if (finalBoard || room.status === 'over') {
    view = (
      <Results
        room={room}
        playerId={playerId}
        leaderboard={finalBoard ?? room.players}
        summary={summary}
        onLeave={leaveRoom}
      />
    );
  } else if (room.status === 'lobby') {
    view = <Lobby room={room} playerId={playerId} onLeave={leaveRoom} />;
  } else {
    view = (
      <Game
        room={room}
        playerId={playerId}
        round={round}
        result={result}
        onLeave={leaveRoom}
      />
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={room ? leaveRoom : undefined} title={room ? 'Leave to home' : undefined}>
          <span className="brand-mark">{'</>'}</span>
          <span className="brand-name">DevGuessr</span>
        </button>
        <div className="topbar-right">
          <button
            className="profile-btn"
            onClick={() => setEditorOpen(true)}
            title="Edit your profile"
            aria-label="Edit your profile"
          >
            <span
              className="avatar avatar-sm"
              style={{ background: avatarColor(profile.name, profile.color) }}
            >
              {profile.avatar || (profile.name.trim().charAt(0) || '?').toUpperCase()}
            </span>
          </button>
          <SoundControl />
          <ThemePicker />
          <span className={`conn ${connected ? 'on' : 'off'}`}>
            {connected ? 'online' : 'connecting…'}
          </span>
        </div>
      </header>
      <main className="content">{view}</main>
      {editorOpen && (
        <ProfileEditor
          initial={profile}
          onClose={() => setEditorOpen(false)}
          onSave={(p) => {
            commitProfile(p);
            setEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}
