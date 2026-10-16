import React, { useState } from 'react';
import { Trophy, RefreshCw, Sparkles } from 'lucide-react';
import type { RankingItem } from '../../../../data/repositories/juegos.repository';

interface RankingJuegosTabProps {
  rankingRunner: RankingItem[];
  rankingSnake: RankingItem[];
  currentUserId?: number;
  loading: boolean;
  onRefresh: () => void;
  onSelectJuego: (juego: 'runner' | 'snake') => void;
}

export const RankingJuegosTab: React.FC<RankingJuegosTabProps> = ({
  rankingRunner,
  rankingSnake,
  currentUserId,
  loading,
  onRefresh,
  onSelectJuego,
}) => {
  const [activeJuego, setActiveJuego] = useState<'runner' | 'snake'>('runner');

  const listaActual = activeJuego === 'runner' ? rankingRunner : rankingSnake;
  const userRecord = listaActual.find(r => r.usuarioId === currentUserId);
  const userRankIndex = listaActual.findIndex(r => r.usuarioId === currentUserId);

  const formatFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const getRoleBadge = (rol: string) => {
    switch (rol?.toLowerCase()) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase">
            Admin
          </span>
        );
      case 'supervisor':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase">
            Supervisor
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
            Recepción
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 space-y-5 bg-surface-lowest">
      
      {/* Título y Selector de Juego */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h4 className="text-base font-black text-on-surface">
              Salón de la Fama Rayza
            </h4>
          </div>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Compite con los otros recepcionistas y supervisores por el mayor récord
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Juego */}
          <div className="flex items-center bg-surface-container-high/60 p-1 rounded-2xl border border-outline-variant/40">
            <button
              onClick={() => setActiveJuego('runner')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeJuego === 'runner'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              🏃 Runner
            </button>
            <button
              onClick={() => setActiveJuego('snake')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeJuego === 'snake'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              🐍 La Viborita
            </button>
          </div>

          {/* Botón de Recarga */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 rounded-xl border border-outline-variant/60 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer disabled:opacity-50"
            title="Actualizar tabla de récords"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner de Estado del Usuario Actual */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-sm">
            {userRankIndex !== -1 ? `#${userRankIndex + 1}` : '—'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-on-surface">Tu Puesto Actual:</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {userRecord ? `${userRecord.puntaje} pts` : 'Sin puntuación aún'}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">
              {userRankIndex === 0 ? (
                '👑 ¡Felicidades! Eres el líder indiscutible del hospedaje en este juego.'
              ) : userRankIndex > 0 ? (
                `🔥 Estás a solo ${listaActual[0].puntaje - userRecord!.puntaje} pts de arrebatarle el 1er lugar a ${listaActual[0].usuarioNombre}.`
              ) : (
                '¡Juega una partida para ingresar a la tabla de posiciones oficial!'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectJuego(activeJuego)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          ¡Superar Récord!
        </button>
      </div>

      {/* Lista del Ranking */}
      {listaActual.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
          <Sparkles className="h-10 w-10 text-amber-400/80 animate-pulse" />
          <h5 className="text-sm font-black text-on-surface">¡Nadie ha marcado un récord todavía!</h5>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Sé el primer colaborador en jugar y dejar tu nombre en la cima de la tabla.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          
          {/* Podio Top 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2">
            {listaActual.slice(0, 3).map((item, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isCurrent = item.usuarioId === currentUserId;

              return (
                <div
                  key={item.id || idx}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-500/10 to-surface-container-low border-amber-500/30 shadow-xs'
                      : isSecond
                      ? 'bg-gradient-to-b from-slate-400/10 to-surface-container-low border-slate-400/30'
                      : 'bg-gradient-to-b from-amber-700/10 to-surface-container-low border-amber-700/30'
                  } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">
                      {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                    </span>
                    {getRoleBadge(item.usuarioRol)}
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-on-surface truncate">
                        {item.usuarioNombre}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-600 font-sans">
                          (Tú)
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-black font-mono text-primary">
                        {item.puntaje} <span className="text-[10px] font-sans font-medium text-on-surface-variant">pts</span>
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {formatFecha(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Posiciones 4 a 10 */}
          {listaActual.length > 3 && (
            <div className="divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-2xl overflow-hidden bg-surface-container-low/40">
              {listaActual.slice(3).map((item, idx) => {
                const pos = idx + 4;
                const isCurrent = item.usuarioId === currentUserId;

                return (
                  <div
                    key={item.id || idx}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                      isCurrent ? 'bg-emerald-500/10 font-bold' : 'hover:bg-surface-container-high/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-on-surface-variant w-4 text-center">
                        #{pos}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-on-surface">
                          {item.usuarioNombre}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            (Tú)
                          </span>
                        )}
                      </div>
                      {getRoleBadge(item.usuarioRol)}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-primary text-sm">
                        {item.puntaje} pts
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {formatFecha(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
