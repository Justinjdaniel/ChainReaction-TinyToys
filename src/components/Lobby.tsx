import React, { useState } from 'react';
import { Player } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { ExplodingHeader } from './ExplodingHeader';

interface LobbyProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  boardRows: number;
  setBoardRows: (r: number) => void;
  boardCols: number;
  setBoardCols: (c: number) => void;
  onStartGame: () => void;
  stats: any;
  leaderboard: any[];
  onResetStats: () => void;
  isLightTheme?: boolean;
}

const COLOR_PALETTE = [
  { name: 'Red', class: 'bg-neonRed text-neonRed', hex: '#ff0055', shadow: 'shadow-neon-red' },
  { name: 'Green', class: 'bg-neonGreen text-neonGreen', hex: '#00ff66', shadow: 'shadow-neon-green' },
  { name: 'Blue', class: 'bg-neonBlue text-neonBlue', hex: '#00f0ff', shadow: 'shadow-neon-blue' },
  { name: 'Yellow', class: 'bg-neonYellow text-neonYellow', hex: '#ffea00', shadow: 'shadow-neon-yellow' },
  { name: 'Purple', class: 'bg-neonPurple text-neonPurple', hex: '#d000ff', shadow: 'shadow-neon-purple' },
  { name: 'Orange', class: 'bg-neonOrange text-neonOrange', hex: '#ff8800', shadow: 'shadow-neon-orange' },
  { name: 'Pink', class: 'bg-neonPink text-neonPink', hex: '#ff00aa', shadow: 'shadow-neon-pink' },
  { name: 'Cyan', class: 'bg-neonCyan text-neonCyan', hex: '#00ffff', shadow: 'shadow-neon-cyan' },
];

export const Lobby: React.FC<LobbyProps> = ({
  players,
  setPlayers,
  boardRows,
  setBoardRows,
  boardCols,
  setBoardCols,
  onStartGame,
  stats,
  leaderboard,
  onResetStats,
  isLightTheme = false
}) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [activePickerId, setActivePickerId] = useState<number | null>(null);

  const handleBtnClick = (action: () => void) => {
    soundEngine.playClick();
    action();
  };

  const addPlayer = () => {
    if (players.length >= 8) return;
    const nextId = players.length;
    const usedColors = players.map(p => p.color);
    const availableColor = COLOR_PALETTE.find(c => !usedColors.includes(c.hex)) || COLOR_PALETTE[nextId % COLOR_PALETTE.length];

    setPlayers([
      ...players,
      {
        id: nextId,
        name: `Player ${nextId + 1}`,
        color: availableColor.hex,
        type: 'human'
      }
    ]);
  };

  const removePlayer = (id: number) => {
    if (players.length <= 2) return;
    const updated = players.filter(p => p.id !== id).map((p, idx) => ({
      ...p,
      id: idx,
      name: p.name.startsWith('Player ') ? `Player ${idx + 1}` : p.name
    }));
    setPlayers(updated);
  };

  const updatePlayerType = (id: number, type: 'human' | 'ai') => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const defaultName = type === 'ai' ? 'AI Bot' : `Player ${id + 1}`;
        return {
          ...p,
          type,
          name: defaultName,
          difficulty: type === 'ai' ? 'medium' : undefined
        };
      }
      return p;
    }));
  };

  const updatePlayerDifficulty = (id: number, difficulty: 'easy' | 'medium' | 'hard') => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        return { ...p, difficulty };
      }
      return p;
    }));
  };

  const updatePlayerColor = (id: number, color: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        return { ...p, color };
      }
      return p;
    }));
    setActivePickerId(null);
  };

  const updatePlayerName = (id: number, name: string) => {
    if (name.length > 14) return; // Enforce maximum name length
    setPlayers(players.map(p => {
      if (p.id === id) {
        return { ...p, name };
      }
      return p;
    }));
  };

  const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(0) : '0';

  const rowPresets = [6, 9, 12];
  const colPresets = [5, 6, 8];

  return (
    <div className={`max-w-5xl w-full mx-auto p-5 md:p-8 border rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden tech-grid-fine space-y-8 transition-all duration-300 ${
      isLightTheme
        ? 'bg-white/95 border-slate-200 text-slate-900'
        : 'bg-slate-950/80 border-slate-900 text-slate-100'
    }`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-neonBlue/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-neonRed/5 to-transparent rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

      {/* Title */}
      <div className="text-center space-y-3 relative z-10">
        <h1 className="text-center">
          <ExplodingHeader
            text="CHAIN REACTION"
            className="text-4xl md:text-6xl font-black tracking-[0.25em] uppercase font-gaming drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-clip-text text-transparent bg-gradient-to-r from-neonRed via-neonBlue to-neonGreen"
          />
        </h1>
        <p className="text-xs text-slate-400 tracking-[0.4em] uppercase font-mono mt-3">
          QUANTUM CASCADE REACTOR STRATEGY
        </p>
      </div>

      {/* Rules Section */}
      <div className={`border p-4 rounded-2xl relative z-10 transition-all duration-300 ${
        isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-900/80'
      }`}>
        <button
          onClick={() => handleBtnClick(() => setRulesOpen(!rulesOpen))}
          className="w-full flex items-center justify-between text-left text-sm font-bold text-neonBlue uppercase tracking-wider focus:outline-none"
        >
          <span className="flex items-center gap-2 font-gaming">
            🌌 REACTOR PROTOCOLS & DOCUMENTATION
          </span>
          <span className="text-xs bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-slate-400 hover:text-neonBlue transition-colors font-mono">
            {rulesOpen ? '▲ COLLAPSE' : '▼ EXPAND RULES'}
          </span>
        </button>

        {rulesOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4 pt-4 border-t border-slate-900 animate-fadeIn">
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-900'
            }`}>
              <span className="font-bold text-neonRed uppercase font-gaming flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neonRed animate-pulse" />
                Explosion Thresholds
              </span>
              <p className="text-slate-400">Each cell has a Critical Mass capacity determined by its location:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 font-mono mt-1 pl-1">
                <li>Corners: Cap = 2 (explodes at 3 orbs)</li>
                <li>Edges: Cap = 3 (explodes at 4 orbs)</li>
                <li>Centers: Cap = 4 (explodes at 5 orbs)</li>
              </ul>
            </div>
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-900'
            }`}>
              <span className="font-bold text-neonGreen uppercase font-gaming flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-pulse" />
                Cascade Subtraction
              </span>
              <p className="text-slate-400">When a cell explodes, it loses its full critical mass capacity plus one orb (leaving 0 orbs behind in that cell).</p>
              <p className="text-slate-500 mt-1">Orbs are distributed orthogonally, converting opponent cells to your color!</p>
            </div>
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-900'
            }`}>
              <span className="font-bold text-neonYellow uppercase font-gaming flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neonYellow animate-pulse" />
                Early Victory Condition
              </span>
              <p className="text-slate-400">If all other players have 0 dots left on the board, the game ends immediately. No need to wait for further explosions to fill all cells.</p>
              <p className="text-slate-500 mt-1">Elimination check begins after each player has placed their first orb.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left config panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dimensions and mini preview */}
          <div className={`border p-6 rounded-2xl space-y-4 ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-900/60'
          }`}>
            <h2 className="text-lg font-bold border-b pb-3 flex justify-between items-center font-gaming border-slate-800">
              <span>BOARD PREVIEW</span>
              <span className="text-sm text-neonBlue font-mono">{boardRows} × {boardCols} GRID</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Presets/Selectors */}
              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height Presets (Rows)</label>
                  <div className="flex gap-2">
                    {rowPresets.map(r => (
                      <button
                        key={r}
                        onClick={() => handleBtnClick(() => setBoardRows(r))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          boardRows === r
                            ? 'bg-neonBlue/10 border-neonBlue text-neonBlue shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                            : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r} ROWS
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Width Presets (Columns)</label>
                  <div className="flex gap-2">
                    {colPresets.map(c => (
                      <button
                        key={c}
                        onClick={() => handleBtnClick(() => setBoardCols(c))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          boardCols === c
                            ? 'bg-neonBlue/10 border-neonBlue text-neonBlue shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                            : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {c} COLS
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Graphic mini grid preview */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-slate-900 h-full min-h-[120px]">
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-2">Simulated Core Matrix</span>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateRows: `repeat(${Math.min(boardRows, 8)}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${Math.min(boardCols, 8)}, minmax(0, 1fr))`
                  }}
                >
                  {Array.from({ length: Math.min(boardRows, 8) }).map((_, rIdx) => (
                    <div key={rIdx} className="flex gap-1">
                      {Array.from({ length: Math.min(boardCols, 8) }).map((_, cIdx) => (
                        <div
                          key={cIdx}
                          className="w-2.5 h-2.5 rounded-sm bg-slate-800/40 border border-slate-800/80 hover:bg-neonBlue/20 transition-all duration-300"
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {boardRows > 8 || boardCols > 8 ? (
                  <span className="text-[7px] text-slate-500 mt-1 font-mono">Display capped at 8x8</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Player lobby cards */}
          <div className={`border p-6 rounded-2xl space-y-4 ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-900/60'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold uppercase font-gaming">COMMANDERS LOBBY</h2>
              <button
                onClick={() => handleBtnClick(addPlayer)}
                disabled={players.length >= 8}
                className="px-4 py-2 bg-neonGreen/10 border border-neonGreen/30 text-neonGreen text-xs rounded-xl hover:bg-neonGreen/20 active:scale-95 transition-all font-semibold font-gaming shadow-[0_0_15px_rgba(0,255,102,0.05)]"
              >
                + ADD PLAYER
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {players.map((player, idx) => {
                const isPickerOpen = activePickerId === player.id;
                return (
                  <div
                    key={player.id}
                    style={{ borderLeftColor: player.color }}
                    className={`flex flex-col md:flex-row items-center justify-between p-4 border-y border-r border-slate-900 border-l-4 rounded-r-xl rounded-l-md gap-4 transition-all duration-300 hover:bg-slate-900/30 group bg-slate-950`}
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto relative">
                      {/* Color selection widget */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => handleBtnClick(() => setActivePickerId(isPickerOpen ? null : player.id))}
                          aria-label={`Select color for ${player.name}`}
                          aria-haspopup="true"
                          className="w-8 h-8 rounded-full border-2 border-slate-800 hover:scale-110 active:scale-90 transition-all shadow-lg flex items-center justify-center relative group-hover:border-slate-600"
                          style={{ backgroundColor: player.color, boxShadow: `0 0 12px ${player.color}40` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-950/20" />
                        </button>
                        {isPickerOpen && (
                          <div className="absolute left-0 top-10 mt-1 grid grid-cols-4 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl z-30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-scaleUp">
                            {COLOR_PALETTE.map(cp => {
                              const isColorUsed = players.some(p => p.color === cp.hex && p.id !== player.id);
                              return (
                                <button
                                  type="button"
                                  key={cp.hex}
                                  disabled={isColorUsed}
                                  onClick={() => handleBtnClick(() => updatePlayerColor(player.id, cp.hex))}
                                  aria-label={`Set color to ${cp.name}`}
                                  className={`w-6 h-6 rounded-full transition-all ${
                                    player.color === cp.hex
                                      ? 'ring-2 ring-neonBlue scale-110'
                                      : isColorUsed
                                      ? 'opacity-20 cursor-not-allowed'
                                      : 'opacity-80 hover:opacity-100 hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: cp.hex, boxShadow: isColorUsed ? 'none' : `0 0 6px ${cp.hex}40` }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Name input */}
                      <div className="flex-1 md:flex-initial">
                        <span className="block text-[9px] text-slate-500 font-mono tracking-widest uppercase">COMMANDER {idx + 1}</span>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => updatePlayerName(player.id, e.target.value)}
                          aria-label={`Name for player ${player.id + 1}`}
                          className="bg-transparent border-b border-slate-900 hover:border-slate-800 focus:border-neonBlue focus:outline-none text-slate-100 text-sm font-bold w-full md:w-40 py-0.5 focus-visible:ring-1 focus-visible:ring-neonBlue transition-colors font-gaming"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      {/* Human vs AI Selector */}
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-600 font-mono tracking-wider uppercase mb-0.5">INTEL</span>
                        <select
                          value={player.type}
                          onChange={(e) => handleBtnClick(() => updatePlayerType(player.id, e.target.value as 'human' | 'ai'))}
                          aria-label={`Type for player ${player.id + 1}`}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:border-neonBlue focus:outline-none transition-colors"
                        >
                          <option value="human">HUMAN PILOT</option>
                          <option value="ai">AI BOT</option>
                        </select>
                      </div>

                      {/* Difficulty Select */}
                      {player.type === 'ai' && (
                        <div className="flex flex-col items-end animate-fadeIn">
                          <span className="text-[8px] text-slate-600 font-mono tracking-wider uppercase mb-0.5">MATRIX</span>
                          <select
                            value={player.difficulty}
                            onChange={(e) => handleBtnClick(() => updatePlayerDifficulty(player.id, e.target.value as 'easy' | 'medium' | 'hard'))}
                            aria-label={`Difficulty for player ${player.id + 1}`}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:border-neonBlue focus:outline-none transition-colors"
                          >
                            <option value="easy">EASY (BIAS)</option>
                            <option value="medium">MEDIUM (GREEDY)</option>
                            <option value="hard">HARD (MINIMAX)</option>
                          </select>
                        </div>
                      )}

                      {/* Delete command card */}
                      {players.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleBtnClick(() => removePlayer(player.id))}
                          className="p-2 mt-4 md:mt-0 bg-red-950/10 border border-red-950/30 hover:border-red-500/50 hover:bg-red-950/30 text-red-500/70 hover:text-red-400 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Remove Player"
                          aria-label={`Remove ${player.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right informative logs and stats panels */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className={`border p-6 rounded-2xl space-y-4 ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-900/60'
          }`}>
            <h2 className="text-lg font-bold border-b pb-3 font-gaming border-slate-800">COMMANDER RECORDS</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                <span className="block text-slate-500 text-[10px] font-mono uppercase tracking-wider">Missions</span>
                <span className="text-3xl font-extrabold text-slate-100 font-mono">{stats.gamesPlayed}</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                <span className="block text-slate-500 text-[10px] font-mono uppercase tracking-wider">Win Ratio</span>
                <span className="text-3xl font-extrabold text-neonBlue font-mono">{winRate}%</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                <span className="block text-slate-500 text-[10px] font-mono uppercase tracking-wider">Streak</span>
                <span className="text-3xl font-extrabold text-neonGreen font-mono">{stats.currentStreak}</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                <span className="block text-slate-500 text-[10px] font-mono uppercase tracking-wider">Max Streak</span>
                <span className="text-3xl font-extrabold text-neonYellow font-mono">{stats.highestStreak}</span>
              </div>
            </div>
          </div>

          {/* Efficiency records / High scores log */}
          <div className={`border p-6 rounded-2xl space-y-4 ${
            isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-900/60'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-800">
              <h2 className="text-lg font-bold uppercase font-gaming">EFFICIENCY LOGS</h2>
              {leaderboard.length > 0 && (
                <button
                  onClick={() => handleBtnClick(onResetStats)}
                  className="text-[10px] text-red-500 hover:text-red-400 hover:underline uppercase font-semibold tracking-wider font-mono"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-600 uppercase font-bold tracking-wider font-mono">No telemetry records loaded</p>
                  <p className="text-[10px] text-slate-500 mt-1">Win games against AI bots to set logs.</p>
                </div>
              ) : (
                leaderboard.map((record, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-neonBlue font-mono text-sm">#{index + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-mono text-xs">{record.boardSize} Grid</span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                          {record.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-neonGreen font-mono text-sm">{record.turns} Turns</span>
                      <span className="block text-[8px] text-slate-600 font-mono mt-0.5">{record.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Start Action CTA */}
      <div className="pt-4 text-center relative z-10">
        <button
          onClick={() => handleBtnClick(onStartGame)}
          className="w-full md:w-3/4 py-5 bg-gradient-to-r from-neonBlue via-neonBlue/80 to-neonGreen text-slate-950 font-black rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all tracking-[0.2em] shadow-[0_0_30px_rgba(0,240,255,0.25)] uppercase font-gaming group overflow-hidden relative"
        >
          <span className="relative z-10">START REACTION CYCLE</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};
