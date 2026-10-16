import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

interface RayzaSnakeGameProps {
  isMuted: boolean;
  highScore: number;
  empresaRecord?: { nombre: string; rol: string; puntaje: number } | null;
  onGameOver: (score: number) => void;
  playBeep: (freq: number, type: OscillatorType, duration: number, endFreq?: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

export const RayzaSnakeGame: React.FC<RayzaSnakeGameProps> = ({
  highScore,
  empresaRecord,
  onGameOver,
  playBeep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [bonusTimer, setBonusTimer] = useState<number>(0);

  // Dimensiones de la cuadrícula
  const COLS = 35;
  const ROWS = 13;
  const CELL_SIZE = 20;
  const CANVAS_WIDTH = COLS * CELL_SIZE; // 700
  const CANVAS_HEIGHT = ROWS * CELL_SIZE; // 260

  // Estado mutable del juego
  const gameRef = useRef({
    snake: [
      { x: 10, y: 6 },
      { x: 9, y: 6 },
      { x: 8, y: 6 },
    ] as Position[],
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    keyFood: { x: 22, y: 6 } as Position,
    starBonus: null as (Position & { expiresAt: number }) | null,
    score: 0,
    speed: 110, // ms por paso
    lastTick: 0,
    pulseFrame: 0,
  });

  const requestRef = useRef<number>(0);

  // Generar posición libre para la comida
  const getRandomFreeCell = useCallback((): Position => {
    const snake = gameRef.current.snake;
    let free = false;
    let pos = { x: 0, y: 0 };
    let attempts = 0;

    while (!free && attempts < 200) {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      // Verificar que no coincida con la serpiente
      const collides = snake.some(seg => seg.x === pos.x && seg.y === pos.y);
      if (!collides) {
        free = true;
      }
      attempts++;
    }
    return pos;
  }, [COLS, ROWS]);

  // Iniciar partida
  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.snake = [
      { x: 8, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 6 },
    ];
    g.direction = 'RIGHT';
    g.nextDirection = 'RIGHT';
    g.score = 0;
    g.speed = 110;
    g.keyFood = getRandomFreeCell();
    g.starBonus = null;
    g.lastTick = performance.now();
    setScore(0);
    setBonusTimer(0);
    setGameState('playing');
    playBeep(440, 'sine', 0.08, 660);
  }, [getRandomFreeCell, playBeep]);

  // Cambiar dirección de movimiento (sin giros de 180°)
  const setDirection = useCallback((newDir: Direction) => {
    const g = gameRef.current;
    const current = g.direction;

    if (newDir === 'UP' && current !== 'DOWN') g.nextDirection = 'UP';
    else if (newDir === 'DOWN' && current !== 'UP') g.nextDirection = 'DOWN';
    else if (newDir === 'LEFT' && current !== 'RIGHT') g.nextDirection = 'LEFT';
    else if (newDir === 'RIGHT' && current !== 'LEFT') g.nextDirection = 'RIGHT';
  }, []);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space') {
        if (gameState === 'idle' || gameState === 'gameover') {
          startGame();
          return;
        }
      }

      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => {
          if (prev === 'playing') return 'paused';
          if (prev === 'paused') return 'playing';
          return prev;
        });
        return;
      }

      if (gameState !== 'playing') return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setDirection, startGame]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = (now: number) => {
      const g = gameRef.current;
      g.pulseFrame++;

      if (gameState === 'playing') {
        // Verificar bonus estrella
        if (g.starBonus && now > g.starBonus.expiresAt) {
          g.starBonus = null;
          setBonusTimer(0);
        } else if (g.starBonus) {
          const remaining = Math.max(0, Math.ceil((g.starBonus.expiresAt - now) / 1000));
          setBonusTimer(remaining);
        }

        // Lógica de movimiento por cadencia
        if (now - g.lastTick >= g.speed) {
          g.lastTick = now;
          g.direction = g.nextDirection;

          const head = { ...g.snake[0] };
          if (g.direction === 'UP') head.y -= 1;
          else if (g.direction === 'DOWN') head.y += 1;
          else if (g.direction === 'LEFT') head.x -= 1;
          else if (g.direction === 'RIGHT') head.x += 1;

          // Colisión con paredes
          if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            playBeep(180, 'sawtooth', 0.25, 80);
            setGameState('gameover');
            onGameOver(g.score);
            return;
          }

          // Colisión con su propio cuerpo
          const selfCollision = g.snake.some(seg => seg.x === head.x && seg.y === head.y);
          if (selfCollision) {
            playBeep(180, 'sawtooth', 0.25, 80);
            setGameState('gameover');
            onGameOver(g.score);
            return;
          }

          // Avanzar cabeza
          const newSnake = [head, ...g.snake];

          // Comprobar si come Llave de Hotel 🗝️
          if (head.x === g.keyFood.x && head.y === g.keyFood.y) {
            g.score += 10;
            setScore(g.score);
            playBeep(520, 'sine', 0.09, 880);
            g.keyFood = getRandomFreeCell();

            // Aumentar velocidad gradualmente (hasta un límite)
            g.speed = Math.max(65, 110 - Math.floor(g.score / 40) * 4);

            // 20% probabilidad de generar Estrella VIP bonus
            if (!g.starBonus && Math.random() < 0.25) {
              const starPos = getRandomFreeCell();
              g.starBonus = { ...starPos, expiresAt: now + 7000 };
            }
          } else if (g.starBonus && head.x === g.starBonus.x && head.y === g.starBonus.y) {
            // Comió Estrella VIP ⭐
            g.score += 50;
            setScore(g.score);
            playBeep(700, 'square', 0.15, 1200);
            g.starBonus = null;
            setBonusTimer(0);
          } else {
            // No comió, quitar última cola
            newSnake.pop();
          }

          g.snake = newSnake;
        }
      }

      // ─── RENDERIZADO ───────────────────────────────────────────────
      // Fondo tipo cuadrícula sutil estilo hotel lounge
      ctx.fillStyle = '#0f172a'; // Pizarra oscura retro premium
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Líneas de cuadrícula sutiles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let c = 0; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * CELL_SIZE);
        ctx.stroke();
      }

      // Dibujar Llave de Habitación 🗝️ (Comida principal)
      const kf = g.keyFood;
      const kx = kf.x * CELL_SIZE + CELL_SIZE / 2;
      const ky = kf.y * CELL_SIZE + CELL_SIZE / 2;
      const glow = Math.sin(g.pulseFrame * 0.15) * 2;

      ctx.save();
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8 + glow;
      ctx.fillStyle = '#facc15'; // Oro brillante
      ctx.beginPath();
      // Anillo de la llave
      ctx.arc(kx - 3, ky, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a'; // Hueco del anillo
      ctx.beginPath();
      ctx.arc(kx - 3, ky, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Eje y dientes de la llave
      ctx.fillStyle = '#facc15';
      ctx.fillRect(kx, ky - 1.5, 7, 3);
      ctx.fillRect(kx + 5, ky + 1.5, 2, 3);
      ctx.restore();

      // Dibujar Estrella VIP ⭐ si está activa
      if (g.starBonus) {
        const sx = g.starBonus.x * CELL_SIZE + CELL_SIZE / 2;
        const sy = g.starBonus.y * CELL_SIZE + CELL_SIZE / 2;
        const starGlow = Math.sin(g.pulseFrame * 0.25) * 4;

        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12 + starGlow;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', sx, sy);
        ctx.restore();
      }

      // Dibujar la Serpiente 🐍 (Temática de botones/carrito esmeralda)
      g.snake.forEach((seg, idx) => {
        const px = seg.x * CELL_SIZE;
        const py = seg.y * CELL_SIZE;

        if (idx === 0) {
          // Cabeza
          ctx.save();
          ctx.fillStyle = '#10b981'; // Esmeralda vibrante
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
          ctx.fill();
          ctx.restore();

          // Ojos según la dirección
          ctx.fillStyle = '#ffffff';
          let eye1 = { x: px + 5, y: py + 5 };
          let eye2 = { x: px + 15, y: py + 5 };

          if (g.direction === 'UP') {
            eye1 = { x: px + 5, y: py + 4 };
            eye2 = { x: px + 15, y: py + 4 };
          } else if (g.direction === 'DOWN') {
            eye1 = { x: px + 5, y: py + 14 };
            eye2 = { x: px + 15, y: py + 14 };
          } else if (g.direction === 'LEFT') {
            eye1 = { x: px + 4, y: py + 5 };
            eye2 = { x: px + 4, y: py + 15 };
          } else if (g.direction === 'RIGHT') {
            eye1 = { x: px + 14, y: py + 5 };
            eye2 = { x: px + 14, y: py + 15 };
          }

          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, 1, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Segmentos del cuerpo con gradiente visual
          const ratio = idx / g.snake.length;
          ctx.fillStyle = ratio > 0.6 ? '#059669' : '#047857';
          ctx.beginPath();
          ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
          ctx.fill();

          // Detalle de costura / botón dorado
          if (idx % 2 === 0) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // ─── OVERLAYS DE ESTADO ────────────────────────────────────────
      if (gameState === 'idle') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐍 La Viborita de Rayza', CANVAS_WIDTH / 2, 90);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Recolecta llaves de hotel 🗝️ (+10 pts) y estrellas VIP ★ (+50 pts).', CANVAS_WIDTH / 2, 120);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Presiona [ESPACIO] o el botón para Empezar', CANVAS_WIDTH / 2, 155);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ JUEGO PAUSADO', CANVAS_WIDTH / 2, 115);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Presiona [P] o el botón para reanudar', CANVAS_WIDTH / 2, 145);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('¡Colisión en el Pasillo!', CANVAS_WIDTH / 2, 85);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Puntaje obtenido: ${score} pts  |  Tu Récord: ${Math.max(score, highScore)} pts`, CANVAS_WIDTH / 2, 115);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Presiona [ESPACIO] o [Reintentar] para jugar de nuevo', CANVAS_WIDTH / 2, 150);
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, score, highScore, onGameOver, playBeep, getRandomFreeCell, COLS, ROWS, CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT]);

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Banner de Récord de la Empresa y Bonus Star */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {empresaRecord && empresaRecord.puntaje > 0 ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Trophy className="h-3.5 w-3.5" />
              <span>Líder general:</span>
              <strong className="text-white font-mono">{empresaRecord.nombre}</strong>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-400/10 text-[10px] font-bold border border-amber-400/20 uppercase">
                {empresaRecord.rol}
              </span>
              <span className="font-mono font-bold text-amber-300">({empresaRecord.puntaje} pts)</span>
            </span>
          ) : (
            <span className="text-slate-400">¡Sé el primero en establecer el récord en la víbora!</span>
          )}
        </div>

        {bonusTimer > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold font-mono text-[11px] animate-pulse">
            <span>★ VIP Activa:</span>
            <span>{bonusTimer}s</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div 
        className="relative bg-slate-950 flex items-center justify-center select-none overflow-hidden w-full cursor-pointer"
        onClick={() => {
          if (gameState === 'idle' || gameState === 'gameover') startGame();
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto block max-h-[260px] object-contain"
        />
      </div>

      {/* Barra de Controles Táctiles y Teclado */}
      <div className="w-full px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px]">Controles:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] font-bold text-slate-300 border border-slate-700">
            Flechas / WASD
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold border border-amber-500/20">
            Esc
          </span>
          <span className="text-[11px] text-amber-400 font-semibold hidden sm:inline">Pánico</span>
        </div>

        {/* D-Pad táctil para pantallas táctiles o clics */}
        <div className="flex items-center gap-1 sm:hidden">
          <button 
            onClick={() => setDirection('LEFT')} 
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setDirection('UP')} 
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setDirection('DOWN')} 
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <button 
            onClick={() => setDirection('RIGHT')} 
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Botón de Acción Principal */}
        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGameState('paused');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              Pausar
            </button>
          ) : gameState === 'paused' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGameState('playing');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Play className="h-3 w-3" /> Reanudar
            </button>
          ) : gameState === 'gameover' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reintentar
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> Jugar Ahora
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
