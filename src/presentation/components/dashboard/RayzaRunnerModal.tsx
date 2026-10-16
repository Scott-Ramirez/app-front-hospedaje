import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, RotateCcw, Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JuegosRepository } from '../../../data/repositories/juegos.repository';
import type { RankingItem } from '../../../data/repositories/juegos.repository';
import { RayzaSnakeGame } from './juegos/RayzaSnakeGame';
import { RankingJuegosTab } from './juegos/RankingJuegosTab';

interface RayzaRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'suitcase' | 'wet_floor' | 'cart';
}

const juegosRepo = new JuegosRepository();

export const RayzaRunnerModal: React.FC<RayzaRunnerModalProps> = ({ isOpen, onClose }) => {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'runner' | 'snake' | 'ranking'>('runner');

  // Récords y Ranking desde Backend
  const [ranking, setRanking] = useState<{ runner: RankingItem[]; snake: RankingItem[] }>({
    runner: [],
    snake: [],
  });
  const [loadingRanking, setLoadingRanking] = useState<boolean>(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Récords personales locales (con fallback a lo que el backend reporte)
  const [highScoreRunner, setHighScoreRunner] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('rayza_runner_highscore') || 0);
    } catch {
      return 0;
    }
  });

  const [highScoreSnake, setHighScoreSnake] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('rayza_snake_highscore') || 0);
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(true); // Silencio por defecto para la recepción

  // ─── AUDIO SYNTHESIZER (8-bit Web Audio API) ──────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((freq: number, type: OscillatorType, duration: number, endFreq?: number) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio no disponible
    }
  }, [isMuted]);

  // Cargar ranking desde el backend
  const cargarRanking = useCallback(async () => {
    setLoadingRanking(true);
    const data = await juegosRepo.obtenerRanking();
    setRanking(data);

    // Sincronizar récords del usuario actual si existen en BD
    if (usuario?.id) {
      const myRunnerRecord = data.runner.find(r => r.usuarioId === usuario.id);
      if (myRunnerRecord && myRunnerRecord.puntaje > highScoreRunner) {
        setHighScoreRunner(myRunnerRecord.puntaje);
        localStorage.setItem('rayza_runner_highscore', String(myRunnerRecord.puntaje));
      }
      const mySnakeRecord = data.snake.find(r => r.usuarioId === usuario.id);
      if (mySnakeRecord && mySnakeRecord.puntaje > highScoreSnake) {
        setHighScoreSnake(mySnakeRecord.puntaje);
        localStorage.setItem('rayza_snake_highscore', String(mySnakeRecord.puntaje));
      }
    }
    setLoadingRanking(false);
  }, [usuario?.id, highScoreRunner, highScoreSnake]);

  useEffect(() => {
    if (isOpen) {
      cargarRanking();
    }
  }, [isOpen, cargarRanking]);

  // Manejador al terminar partida para registrar puntaje en backend
  const handleRecordSubmit = useCallback(async (juego: 'runner' | 'snake', puntajeFinal: number) => {
    if (puntajeFinal <= 0) return;

    if (juego === 'runner') {
      if (puntajeFinal > highScoreRunner) {
        setHighScoreRunner(puntajeFinal);
        try { localStorage.setItem('rayza_runner_highscore', String(puntajeFinal)); } catch {}
      }
    } else {
      if (puntajeFinal > highScoreSnake) {
        setHighScoreSnake(puntajeFinal);
        try { localStorage.setItem('rayza_snake_highscore', String(puntajeFinal)); } catch {}
      }
    }

    const resultado = await juegosRepo.guardarRecord(juego, puntajeFinal);
    if (resultado) {
      setRanking(prev => ({
        ...prev,
        [juego]: resultado.ranking,
      }));

      // Notificación de nuevo récord o liderazgo
      if (resultado.ranking[0]?.usuarioId === usuario?.id && resultado.esNuevoRecord) {
        setCelebrationMsg(`👑 ¡INCREÍBLE! Eres el nuevo #1 del hospedaje con ${puntajeFinal} pts`);
        playBeep(600, 'square', 0.3, 1200);
      } else if (resultado.esNuevoRecord) {
        setCelebrationMsg(`🔥 ¡Superaste tu récord personal! Nuevo puntaje: ${puntajeFinal} pts`);
      }

      setTimeout(() => setCelebrationMsg(null), 6000);
    }
  }, [highScoreRunner, highScoreSnake, usuario?.id, playBeep]);

  // ─── ESTADO Y LÓGICA DE RAYZA RUNNER ──────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [runnerState, setRunnerState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [runnerScore, setRunnerScore] = useState<number>(0);

  const gameRef = useRef({
    playerY: 0,
    playerVy: 0,
    isJumping: false,
    frame: 0,
    speed: 5.2,
    score: 0,
    obstacles: [] as Obstacle[],
    nextObstacleTimer: 80,
    clouds: [
      { x: 120, y: 35, s: 0.8 },
      { x: 380, y: 55, s: 1.2 },
      { x: 620, y: 30, s: 0.9 },
    ],
    floorOffset: 0,
  });

  const requestRef = useRef<number>(0);

  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 240;
  const GROUND_Y = 195;
  const PLAYER_X = 65;
  const PLAYER_W = 32;
  const PLAYER_H = 46;
  const GRAVITY = 0.68;
  const JUMP_FORCE = -11.5;

  const handleRunnerJump = useCallback(() => {
    if (activeTab !== 'runner') return;
    const g = gameRef.current;
    if (runnerState === 'idle' || runnerState === 'gameover') {
      g.playerY = 0;
      g.playerVy = 0;
      g.isJumping = false;
      g.frame = 0;
      g.speed = 5.2;
      g.score = 0;
      g.obstacles = [];
      g.nextObstacleTimer = 60;
      setRunnerScore(0);
      setRunnerState('playing');
      playBeep(350, 'square', 0.1, 700);
      return;
    }

    if (runnerState === 'playing') {
      if (!g.isJumping) {
        g.playerVy = JUMP_FORCE;
        g.isJumping = true;
        playBeep(280, 'sine', 0.1, 550);
      }
    }
  }, [activeTab, runnerState, playBeep]);

  // Tecla Escape para cerrar al instante (Modo Pánico) y controles generales
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (activeTab === 'runner') {
        if (e.code === 'Space' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleRunnerJump();
        }
        if (e.key === 'p' || e.key === 'P') {
          setRunnerState(prev => {
            if (prev === 'playing') return 'paused';
            if (prev === 'paused') return 'playing';
            return prev;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeTab, handleRunnerJump]);

  // Game Loop de Rayza Runner
  useEffect(() => {
    if (!isOpen || activeTab !== 'runner') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnObstacle = () => {
      const g = gameRef.current;
      const types: Array<'suitcase' | 'wet_floor' | 'cart'> = ['suitcase', 'wet_floor', 'cart'];
      const chosen = types[Math.floor(Math.random() * types.length)];

      let width = 28;
      let height = 30;

      if (chosen === 'suitcase') {
        width = 28;
        height = 32;
      } else if (chosen === 'wet_floor') {
        width = 24;
        height = 34;
      } else if (chosen === 'cart') {
        width = 44;
        height = 38;
      }

      g.obstacles.push({
        x: CANVAS_WIDTH + 20,
        y: GROUND_Y - height,
        width,
        height,
        type: chosen,
      });

      const minDistance = Math.max(45, Math.floor(100 - g.speed * 4));
      const variation = Math.floor(Math.random() * 50);
      g.nextObstacleTimer = minDistance + variation;
    };

    const updateAndRender = () => {
      const g = gameRef.current;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Fondo suave de recepción
      ctx.fillStyle = '#f8faf9';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Nubes decorativas
      ctx.fillStyle = '#e2e8f0';
      g.clouds.forEach(c => {
        if (runnerState === 'playing') {
          c.x -= 0.6 * c.s;
          if (c.x < -100) c.x = CANVAS_WIDTH + 80;
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14 * c.s, 0, Math.PI * 2);
        ctx.arc(c.x + 12 * c.s, c.y - 4 * c.s, 16 * c.s, 0, Math.PI * 2);
        ctx.arc(c.x + 24 * c.s, c.y, 12 * c.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // Suelo y zócalo elegante
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // Textura del suelo
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      if (runnerState === 'playing') {
        g.floorOffset = (g.floorOffset + g.speed) % 36;
      }
      for (let x = -g.floorOffset; x < CANVAS_WIDTH; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 1);
        ctx.lineTo(x + 14, GROUND_Y + 12);
        ctx.stroke();
      }

      // Actualizar física en juego activo
      if (runnerState === 'playing') {
        g.frame++;
        g.playerY += g.playerVy;
        g.playerVy += GRAVITY;

        if (g.playerY >= 0) {
          g.playerY = 0;
          g.playerVy = 0;
          g.isJumping = false;
        }

        if (g.frame % 5 === 0) {
          g.score += 1;
          setRunnerScore(g.score);

          if (g.score % 100 === 0 && g.score > 0) {
            playBeep(520, 'triangle', 0.12, 880);
          }
        }

        g.speed = Math.min(10.5, 5.2 + g.score * 0.0035);

        g.nextObstacleTimer--;
        if (g.nextObstacleTimer <= 0) {
          spawnObstacle();
        }

        g.obstacles.forEach(obs => {
          obs.x -= g.speed;
        });

        g.obstacles = g.obstacles.filter(obs => obs.x + obs.width > -20);

        // Comprobación de colisiones
        const pBox = {
          x: PLAYER_X + 6,
          y: GROUND_Y - PLAYER_H + g.playerY + 4,
          w: PLAYER_W - 12,
          h: PLAYER_H - 6,
        };

        for (const obs of g.obstacles) {
          const oBox = {
            x: obs.x + 3,
            y: obs.y + 3,
            w: obs.width - 6,
            h: obs.height - 4,
          };

          if (
            pBox.x < oBox.x + oBox.w &&
            pBox.x + pBox.w > oBox.x &&
            pBox.y < oBox.y + oBox.h &&
            pBox.y + pBox.h > oBox.y
          ) {
            playBeep(160, 'sawtooth', 0.25, 70);
            setRunnerState('gameover');
            handleRecordSubmit('runner', g.score);
            break;
          }
        }
      }

      // Dibujar Obstáculos
      g.obstacles.forEach(obs => {
        if (obs.type === 'suitcase') {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.roundRect(obs.x + 2, obs.y + 4, obs.width - 4, obs.height - 4, 4);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + 4, 5, Math.PI, 0, false);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(obs.x + 6, obs.y + 12, obs.width - 12, 3);
        } else if (obs.type === 'wet_floor') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.lineTo(obs.x, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', obs.x + obs.width / 2, obs.y + obs.height - 8);
        } else if (obs.type === 'cart') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(obs.x + 4, obs.y + 8, obs.width - 8, obs.height - 14);

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(obs.x + 10, obs.y + obs.height - 4, 4, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width - 10, obs.y + obs.height - 4, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x + 8, obs.y + 12, obs.width - 16, 4);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(obs.x + 8, obs.y + 17, obs.width - 16, 4);

          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width - 4, obs.y + 2);
          ctx.lineTo(obs.x + obs.width + 4, obs.y - 8);
          ctx.stroke();
        }
      });

      // Dibujar Botones (Jugador)
      const currentY = GROUND_Y - PLAYER_H + g.playerY;
      const runCycle = Math.floor(g.frame / 6) % 2;

      ctx.save();
      ctx.translate(PLAYER_X, currentY);

      // Gorra
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(PLAYER_W / 2, 8, 7, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(PLAYER_W / 2 - 2, 7, 10, 2);

      // Cabeza
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(PLAYER_W / 2, 16, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cara
      ctx.fillStyle = '#0f172a';
      if (runnerState === 'gameover') {
        ctx.font = '9px monospace';
        ctx.fillText('x', PLAYER_W / 2 + 1, 17);
      } else {
        ctx.fillRect(PLAYER_W / 2 + 2, 14, 2, 2);
      }

      // Chaqueta
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(PLAYER_W / 2 - 6, 23, 13, 14, 3);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(PLAYER_W / 2, 25, 2, 2);
      ctx.fillRect(PLAYER_W / 2, 29, 2, 2);
      ctx.fillRect(PLAYER_W / 2, 33, 2, 2);

      // Piernas
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      if (g.isJumping) {
        ctx.beginPath();
        ctx.moveTo(PLAYER_W / 2 - 3, 37);
        ctx.lineTo(PLAYER_W / 2 - 8, 41);
        ctx.moveTo(PLAYER_W / 2 + 3, 37);
        ctx.lineTo(PLAYER_W / 2 + 6, 40);
        ctx.stroke();
      } else {
        ctx.beginPath();
        if (runCycle === 0) {
          ctx.moveTo(PLAYER_W / 2 - 3, 37);
          ctx.lineTo(PLAYER_W / 2 - 6, 46);
          ctx.moveTo(PLAYER_W / 2 + 3, 37);
          ctx.lineTo(PLAYER_W / 2 + 6, 45);
        } else {
          ctx.moveTo(PLAYER_W / 2 - 3, 37);
          ctx.lineTo(PLAYER_W / 2 + 5, 46);
          ctx.moveTo(PLAYER_W / 2 + 3, 37);
          ctx.lineTo(PLAYER_W / 2 - 5, 45);
        }
        ctx.stroke();
      }

      ctx.restore();

      // Overlays
      if (runnerState === 'idle') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏃‍♂️ Rayza Runner', CANVAS_WIDTH / 2, 90);

        ctx.fillStyle = '#475569';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Esquiva las maletas, carritos y señales de piso mojado.', CANVAS_WIDTH / 2, 118);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Presiona [ESPACIO] o Clic para Empezar', CANVAS_WIDTH / 2, 150);
      } else if (runnerState === 'paused') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ JUEGO PAUSADO', CANVAS_WIDTH / 2, 105);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Presiona [P] o [ESPACIO] para reanudar', CANVAS_WIDTH / 2, 130);
      } else if (runnerState === 'gameover') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('¡Fin del Recorrido!', CANVAS_WIDTH / 2, 85);

        ctx.fillStyle = '#1e293b';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Puntos obtenidos: ${runnerScore}  |  Tu Récord: ${Math.max(runnerScore, highScoreRunner)}`, CANVAS_WIDTH / 2, 115);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Presiona [ESPACIO] o el botón para reintentar', CANVAS_WIDTH / 2, 148);
      }

      requestRef.current = requestAnimationFrame(updateAndRender);
    };

    requestRef.current = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isOpen, activeTab, runnerState, highScoreRunner, runnerScore, playBeep, handleRecordSubmit]);

  if (!isOpen) return null;

  const primerLugarRunner = ranking.runner[0];
  const primerLugarSnake = ranking.snake[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-surface-lowest rounded-3xl border border-outline-variant/70 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER CON TABS DE JUEGO Y RANKING */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-outline-variant/50 bg-surface-container-low/50 gap-3">
          
          {/* Tabs Principales */}
          <div className="flex items-center gap-1.5 bg-surface-container-high/60 p-1 rounded-2xl border border-outline-variant/40 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('runner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'runner'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>🏃 Runner</span>
            </button>
            <button
              onClick={() => setActiveTab('snake')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'snake'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>🐍 La Viborita</span>
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-on-surface-variant hover:text-amber-600'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Ranking</span>
            </button>
          </div>

          {/* Marcadores y Acciones Superiores */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            
            {/* Récord del Juego Actual */}
            <div className="flex items-center gap-2.5 bg-surface-container-high/60 px-3 py-1.5 rounded-xl border border-outline-variant/40">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-xs font-black" title="Tu mejor récord">
                <Trophy className="h-3.5 w-3.5" />
                <span>{activeTab === 'snake' ? highScoreSnake : highScoreRunner}</span>
              </div>
              <div className="h-3 w-px bg-outline-variant/60" />
              <div className="font-mono text-xs font-black text-primary">
                {activeTab === 'snake' ? 'Víbora' : activeTab === 'runner' ? `${runnerScore} pts` : 'Top'}
              </div>
            </div>

            {/* Alternar Sonido */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-xl border border-outline-variant/50 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              title={isMuted ? 'Activar sonido 8-bit' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}
            </button>

            {/* Botón de Cierre Inmediato (Modo Pánico) */}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl border border-outline-variant/50 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 flex items-center justify-center text-on-surface-variant transition-all cursor-pointer"
              title="Cerrar de inmediato (Tecla Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* BANNER DE CELEBRACIÓN DE RÉCORD */}
        {celebrationMsg && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-inner animate-in slide-in-from-top duration-300">
            <Sparkles className="h-4 w-4" />
            <span>{celebrationMsg}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: JUEGO O RANKING */}
        {activeTab === 'runner' ? (
          <div>
            {/* Banner de Récord de Empresa Runner */}
            <div className="w-full flex items-center justify-between px-4 py-1.5 bg-surface-container-high/40 border-b border-outline-variant/30 text-xs text-on-surface-variant">
              {primerLugarRunner && primerLugarRunner.puntaje > 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span className="text-amber-500 font-bold">🥇 Mejor récord en Runner:</span>
                  <span className="font-bold text-on-surface">{primerLugarRunner.usuarioNombre}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold uppercase">
                    {primerLugarRunner.usuarioRol}
                  </span>
                  <span className="font-mono font-bold text-emerald-600">({primerLugarRunner.puntaje} pts)</span>
                </div>
              ) : (
                <span className="text-[11px] text-on-surface-variant font-medium">
                  ¡Sé el primero en marcar un récord en Rayza Runner!
                </span>
              )}
            </div>

            {/* Canvas Runner */}
            <div 
              className="relative bg-[#f8faf9] flex items-center justify-center cursor-pointer select-none overflow-hidden"
              onClick={handleRunnerJump}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-auto block max-h-[260px] object-contain"
              />
            </div>

            {/* Footer Runner */}
            <div className="px-5 py-3 border-t border-outline-variant/50 bg-surface-container-low/40 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high font-mono text-[11px] font-bold border border-outline-variant/40">
                  Espacio / Clic
                </span>
                <span className="text-[11px]">Saltar</span>
                <span className="text-outline-variant mx-1">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold border border-amber-500/20">
                  Esc
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Pánico</span>
              </div>

              <div className="flex items-center gap-2">
                {runnerState === 'playing' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRunnerState('paused');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-lowest hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors cursor-pointer"
                  >
                    <span>Pausar</span>
                  </button>
                ) : runnerState === 'paused' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRunnerState('playing');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Play className="h-3 w-3" />
                    <span>Reanudar</span>
                  </button>
                ) : runnerState === 'gameover' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunnerJump();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reintentar</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunnerJump();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Jugar Ahora</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'snake' ? (
          <div>
            <RayzaSnakeGame
              isMuted={isMuted}
              highScore={highScoreSnake}
              empresaRecord={primerLugarSnake ? {
                nombre: primerLugarSnake.usuarioNombre,
                rol: primerLugarSnake.usuarioRol,
                puntaje: primerLugarSnake.puntaje,
              } : null}
              onGameOver={(finalScore) => handleRecordSubmit('snake', finalScore)}
              playBeep={playBeep}
            />
          </div>
        ) : (
          <div>
            <RankingJuegosTab
              rankingRunner={ranking.runner}
              rankingSnake={ranking.snake}
              currentUserId={usuario?.id}
              loading={loadingRanking}
              onRefresh={cargarRanking}
              onSelectJuego={(j) => setActiveTab(j)}
            />
          </div>
        )}

      </div>
    </div>
  );
};
