import { useEffect, useState } from 'react';
import Game from './components/Game';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Results from './components/Results';
import { socket } from './socket';
import type {
  GameOverPayload,
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
      }
    };
    const onRoundStart = (p: RoundStartPayload) => {
      setRound(p);
      setResult(null);
      setFinalBoard(null);
    };
    const onRoundResult = (p: RoundResultPayload) => setResult(p);
    const onGameOver = (p: GameOverPayload) => setFinalBoard(p.leaderboard);

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
  };

  let view;
  if (!room) {
    view = <Home onJoined={(id) => setPlayerId(id)} connected={connected} />;
  } else if (finalBoard || room.status === 'over') {
    view = (
      <Results
        room={room}
        playerId={playerId}
        leaderboard={finalBoard ?? room.players}
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
        <span className={`conn ${connected ? 'on' : 'off'}`}>
          {connected ? 'online' : 'connecting…'}
        </span>
      </header>
      <main className="content">{view}</main>
    </div>
  );
}
