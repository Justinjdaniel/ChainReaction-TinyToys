import { useState, useEffect, useRef } from 'react';
import { Player, Cell } from './types/game';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { ChainReactionEngine } from './utils/ChainReactionEngine';
import { ChainReactionAI } from './utils/ChainReactionAI';
import { useGameStats } from './hooks/useGameStats';
import { soundEngine } from './utils/soundEngine';
import { ExplodingHeader } from './components/ExplodingHeader';

export function App() {
  const [inGame, setInGame] = useState(false);
  const [boardRows, setBoardRows] = useState(9);
  const [boardCols, setBoardCols] = useState(6);

  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: 'Player 1', color: '#ff0055', type: 'human' },
    { id: 1, name: 'AI Bot', color: '#00ff66', type: 'ai', difficulty: 'medium' }
  ]);

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [explodingCells, setExplodingCells] = useState<{ r: number; c: number }[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  // Keep a history of entire engine state clones for undoing moves
  const [history, setHistory] = useState<ChainReactionEngine[]>([]);

  const engineRef = useRef<ChainReactionEngine | null>(null);

  const { stats, leaderboard, recordWin, recordLoss, recordEfficiency, resetStats } = useGameStats();

  // Sound and Theme states
  const [soundEnabled, setSoundEnabled] = useState(() => soundEngine.getSoundEnabled());
  const [isLightTheme, setIsLightTheme] = useState(() => {
    return localStorage.getItem('chain_reaction_light_theme') === 'true';
  });

  // Easter Egg States
  const versionClicksRef = useRef(0);
  const [crtMode, setCrtMode] = useState(false);

  // Initialize/track sound engine changes
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (soundEnabled) {
        soundEngine.startBackgroundMusic();
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [soundEnabled]);

  const toggleSound = () => {
    soundEngine.playClick();
    const nextVal = soundEngine.toggleSound();
    setSoundEnabled(nextVal);
  };

  const toggleTheme = () => {
    soundEngine.playClick();
    setIsLightTheme(prev => {
      const next = !prev;
      localStorage.setItem('chain_reaction_light_theme', String(next));
      return next;
    });
  };

  const handleVersionClick = () => {
    soundEngine.playClick();
    versionClicksRef.current += 1;
    if (versionClicksRef.current >= 5) {
      // Toggle easter egg
      setCrtMode(curr => !curr);
      soundEngine.playSecretEasterEggSong();
      versionClicksRef.current = 0;
    }
  };

  const handleStartGame = () => {
    soundEngine.playClick();
    const engine = new ChainReactionEngine(boardRows, boardCols, players.length);
    engineRef.current = engine;
    setGrid(engine.cloneGridState());
    setCurrentPlayer(engine.currentPlayer);
    setWinner(null);
    setExplodingCells([]);
    setIsProcessing(false);
    setHistory([]);
    setInGame(true);
  };

  const handleExitGame = () => {
    soundEngine.playClick();
    setInGame(false);
    setWinner(null);
    setHistory([]);
    engineRef.current = null;
  };

  useEffect(() => {
    if (!inGame || winner || isProcessing || !engineRef.current) return;

    const activePlayer = players[currentPlayer];
    if (activePlayer && activePlayer.type === 'ai') {
      setIsProcessing(true);
      const timer = setTimeout(async () => {
        const engine = engineRef.current;
        if (!engine) return;

        const bestMove = ChainReactionAI.getBestMove(engine, currentPlayer, activePlayer.difficulty || 'medium');
        if (bestMove) {
          await handleCellMove(bestMove.r, bestMove.c);
        } else {
          engine.advanceTurn();
          setGrid(engine.cloneGridState());
          setCurrentPlayer(engine.currentPlayer);
          setIsProcessing(false);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inGame, currentPlayer, isProcessing, winner]);

  const handleCellMove = async (r: number, c: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    setIsProcessing(true);

    // Play placement chime
    soundEngine.playPlaceOrb();

    const success = await engine.placeOrb(r, c, currentPlayer, async (snapshot) => {
      const exploding = [];
      for (let row = 0; row < engine.rows; row++) {
        for (let col = 0; col < engine.cols; col++) {
          if (engine.grid[row][col].orbs >= engine.grid[row][col].criticalMass + 1) {
            exploding.push({ r: row, c: col });
          }
        }
      }

      if (exploding.length > 0) {
        // Play synthetic explosion sound
        soundEngine.playExplode();
      }

      setExplodingCells(exploding);
      setGrid(snapshot);
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    if (success) {
      setExplodingCells([]);
      setGrid(engine.cloneGridState());

      if (engine.checkGameOver()) {
        const winIdx = engine.getWinner();
        if (winIdx !== null) {
          const winningPlayer = players[winIdx];
          setWinner(winningPlayer);

          if (winningPlayer.type === 'human') {
            soundEngine.playVictory();
            recordWin();
            const boardDiff = players.some(p => p.type === 'ai')
              ? (players.find(p => p.type === 'ai')?.difficulty || 'medium')
              : 'local';
            recordEfficiency(engine.turnCount, boardRows, boardCols, boardDiff);
          } else {
            soundEngine.playDefeat();
            recordLoss();
          }
        }
      } else {
        setCurrentPlayer(engine.currentPlayer);
      }
    }

    setIsProcessing(false);
  };

  const handleCellClick = async (r: number, c: number) => {
    if (isProcessing || winner) return;
    const activePlayer = players[currentPlayer];
    if (activePlayer.type === 'ai') return;

    // Save current engine state to history before human moves
    if (engineRef.current) {
      setHistory((prev) => [...prev, engineRef.current!.clone()]);
    }

    await handleCellMove(r, c);
  };

  const handleUndo = () => {
    soundEngine.playClick();
    if (isProcessing || history.length === 0) return;

    // Pop saved engine state
    const previousEngine = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    engineRef.current = previousEngine;
    setGrid(previousEngine.cloneGridState());
    setCurrentPlayer(previousEngine.currentPlayer);
    setWinner(null);
    setExplodingCells([]);
    setIsProcessing(false);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-neonBlue selection:text-slate-950 tech-grid font-sans relative ${
      isLightTheme
        ? 'bg-slate-100 text-slate-900 border-slate-300'
        : 'bg-slate-950 text-slate-100'
    } ${crtMode ? 'crt-effect' : ''}`}>
      {crtMode && <div className="crt-scanlines pointer-events-none absolute inset-0 z-50" />}

      <header className={`p-4 border-b bg-opacity-80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between ${
        isLightTheme ? 'border-slate-200 bg-white/80' : 'border-slate-900 bg-slate-950/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-neonGreen animate-pulse shadow-[0_0_10px_#00ff66]" />
          <span className={`font-gaming text-xs md:text-sm tracking-[0.2em] font-extrabold uppercase ${
            isLightTheme ? 'text-slate-800' : 'text-slate-200'
          }`}>
            Chain Reaction PWA
          </span>
          <button
            onClick={handleVersionClick}
            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-black text-neonRed font-mono tracking-wider ml-1"
          >
            v1.0.0
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? "Disable audio synthesizers" : "Enable audio synthesizers"}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-neonGreen/10 border-neonGreen text-neonGreen shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? '🔊 ON' : '🔇 OFF'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isLightTheme ? "Switch to artistic dark neon theme" : "Switch to retro synthwave light theme"}
            className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
          >
            {isLightTheme ? '🌙 DARK' : '☀️ LIGHT'}
          </button>

          {inGame && (
            <button
              onClick={handleExitGame}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 hover:text-neonRed border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-gaming"
            >
              ← Exit
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        {!inGame ? (
          <Lobby
            players={players}
            setPlayers={setPlayers}
            boardRows={boardRows}
            setBoardRows={setBoardRows}
            boardCols={boardCols}
            setBoardCols={setBoardCols}
            onStartGame={handleStartGame}
            stats={stats}
            leaderboard={leaderboard}
            onResetStats={resetStats}
            isLightTheme={isLightTheme}
          />
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center gap-6 relative z-10 animate-fadeIn">
            <Board
              grid={grid}
              currentPlayer={currentPlayer}
              players={players}
              onCellClick={handleCellClick}
              isProcessing={isProcessing}
              explodingCells={explodingCells}
              isLightTheme={isLightTheme}
            />

            {/* Undo button */}
            <div className="flex justify-center w-full max-w-sm px-4">
              <button
                onClick={handleUndo}
                disabled={isProcessing || history.length === 0}
                className={`
                  w-full py-3.5 border-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 font-gaming
                  ${(isProcessing || history.length === 0)
                    ? 'border-slate-900 bg-slate-950/20 text-slate-700 cursor-not-allowed'
                    : 'border-neonBlue/80 bg-neonBlue/5 text-neonBlue hover:bg-neonBlue/15 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:scale-[1.02]'
                  }
                `}
              >
                ↩ Undo Last Move
              </button>
            </div>

            {winner && (
              <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div
                  style={{ borderColor: winner.color, boxShadow: `0 0 40px ${winner.color}30, inset 0 0 20px ${winner.color}15` }}
                  className="max-w-md w-full bg-slate-950 border-2 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden tech-grid-fine"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: winner.color }} />

                  <h2 className="text-center">
                    <ExplodingHeader
                      text="VICTORY!"
                      className="text-4xl font-black uppercase tracking-[0.2em] text-slate-100 font-gaming"
                    />
                  </h2>
                  <div className="flex justify-center">
                    <div
                      style={{ backgroundColor: winner.color, boxShadow: `0 0 25px ${winner.color}80` }}
                      className="w-20 h-20 rounded-full flex items-center justify-center font-black text-slate-950 text-2xl animate-bounce"
                    >
                      🏆
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black uppercase tracking-wide font-gaming" style={{ color: winner.color }}>
                      {winner.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">
                      has established complete dominance over the grid!
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-3">
                    <button
                      onClick={handleStartGame}
                      className="py-4 bg-gradient-to-r from-neonGreen to-neonGreen/80 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-xl uppercase text-sm tracking-widest transition-all font-gaming"
                    >
                      ⚡ REMATCH ⚡
                    </button>
                    {history.length > 0 && (
                      <button
                        onClick={handleUndo}
                        className="py-3 bg-neonBlue/10 border-2 border-neonBlue text-neonBlue font-bold rounded-xl hover:bg-neonBlue/20 uppercase text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] font-gaming"
                      >
                        ↩ Undo Winning Blow
                      </button>
                    )}
                    <button
                      onClick={handleExitGame}
                      className="py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-xl hover:bg-slate-800 uppercase text-xs tracking-wider transition-all font-gaming"
                    >
                      Exit to Lobby
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={`p-4 border-t text-center text-[9px] font-mono uppercase tracking-[0.3em] ${
        isLightTheme ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-900 bg-slate-950 text-slate-600'
      }`}>
        © CHAIN REACTION ENGINE v1.0.0 • QUANTUM LOCAL-FIRST TERMINAL • OFFLINE CAPABLE PWA
      </footer>
    </div>
  );
}
