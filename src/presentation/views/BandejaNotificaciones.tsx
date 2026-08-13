import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { HabitacionesRepository } from '../../data/repositories/habitaciones.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import {
  Trash2,
  CheckCircle2,
  Clock,
  Inbox,
  Check,
  Filter,
  KeyRound,
  Loader2
} from 'lucide-react';

const habitacionesRepo = new HabitacionesRepository();

export const BandejaNotificaciones: React.FC = () => {
  const { notificaciones, marcarComoLeida, limpiarTodas } = useNotifications();
  const { usuario } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'no-leidos' | 'leidos'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'caja' | 'limpieza' | 'auditoria'>('todos');
  const [liberandoHab, setLiberandoHab] = useState<string | null>(null);

  const handleLiberarHabitacion = async (numeroHab: string, alertaId: string) => {
    try {
      setLiberandoHab(numeroHab);
      await habitacionesRepo.liberar(numeroHab);
      AlertAdapter.success('Habitación Liberada', `La habitación N° ${numeroHab} ha sido liberada correctamente y ya está disponible.`);
      marcarComoLeida(alertaId);
    } catch (err: any) {
      AlertAdapter.error('Error al Liberar', err.response?.data?.message || 'No se pudo liberar la habitación.');
    } finally {
      setLiberandoHab(null);
    }
  };

  const formatHoraExacta = (fechaStr: string) => {
    try {
      const opciones: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return new Date(fechaStr).toLocaleDateString('es-PE', opciones);
    } catch {
      return fechaStr;
    }
  };

  const handleMarcarTodasLeidas = () => {
    notificaciones.forEach(n => {
      if (!n.leido) {
        marcarComoLeida(n.id);
      }
    });
  };

  // Filtrar notificaciones
  const filtradas = notificaciones.filter(n => {
    // 1. Filtrar por estado de lectura
    if (filtroEstado === 'no-leidos' && n.leido) return false;
    if (filtroEstado === 'leidos' && !n.leido) return false;

    // 2. Filtrar por tipo (habitacionNumero)
    if (filtroTipo === 'caja') {
      return n.habitacionNumero === 'CAJA' || n.habitacionNumero === 'EGRESO';
    }
    if (filtroTipo === 'auditoria') {
      return n.habitacionNumero === 'AUDITORÍA' || n.habitacionNumero === 'SISTEMA';
    }
    if (filtroTipo === 'limpieza') {
      return n.habitacionNumero !== 'CAJA' && n.habitacionNumero !== 'EGRESO' && n.habitacionNumero !== 'AUDITORÍA' && n.habitacionNumero !== 'SISTEMA';
    }

    return true;
  });

  const conteoNoLeidas = notificaciones.filter(n => !n.leido).length;

  return (
    <div className="p-6 max-w-[1000px] mx-auto text-on-surface space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-primary" />
            Bandeja de Entrada
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Mensajes, conciliaciones, egresos y alertas emitidas por el sistema en tiempo real.
          </p>
        </div>

        {notificaciones.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 select-none">
            {conteoNoLeidas > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                Marcar leídos
              </button>
            )}
            <button
              onClick={limpiarTodas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Vaciar bandeja
            </button>
          </div>
        )}
      </div>

      {/* METRICAS Y FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {/* Lado izquierdo: Controles de filtro */}
        <div className="md:col-span-1 bg-surface-lowest border border-outline-variant/80 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 border-b border-outline-variant/40 pb-2">
            <Filter className="h-3.5 w-3.5" />
            Filtrar Mensajes
          </h3>

          {/* Filtro Estado */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Estado de Lectura</label>
            <div className="flex flex-col gap-1">
              {(['todos', 'no-leidos', 'leidos'] as const).map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    filtroEstado === est
                      ? 'bg-primary-container/10 text-primary border-l-4 border-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {est === 'todos' && 'Todos los mensajes'}
                  {est === 'no-leidos' && `No leídos (${conteoNoLeidas})`}
                  {est === 'leidos' && 'Leídos'}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Categoría */}
          <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Categoría / Módulo</label>
            <div className="flex flex-col gap-1">
              {(['todos', 'caja', 'auditoria', 'limpieza'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroTipo(cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    filtroTipo === cat
                      ? 'bg-primary-container/10 text-primary border-l-4 border-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat === 'todos' && 'Todas las categorías'}
                  {cat === 'caja' && 'Caja y Egresos'}
                  {cat === 'auditoria' && 'Auditorías y Turnos'}
                  {cat === 'limpieza' && 'Alertas de Limpieza'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado derecho: Lista de Mensajes */}
        <div className="md:col-span-3 space-y-3">
          {filtradas.length === 0 ? (
            <div className="bg-surface-lowest border border-outline-variant/80 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-surface-container rounded-full text-on-surface-variant/35">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">No hay mensajes</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                  {filtroEstado !== 'todos' || filtroTipo !== 'todos'
                    ? 'No hay notificaciones con los filtros actuales.'
                    : 'Tu bandeja de alertas está al día.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtradas.map((alerta) => {
                const esCaja = alerta.habitacionNumero === 'CAJA' || alerta.habitacionNumero === 'EGRESO';
                const esAudit = alerta.habitacionNumero === 'AUDITORÍA' || alerta.habitacionNumero === 'SISTEMA';
                
                // Color dinámico según la etiqueta
                const badgeColor = esCaja
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : esAudit
                  ? 'bg-sky-500/10 text-sky-700 border-sky-500/20'
                  : 'bg-primary/10 text-primary border-primary/20';

                return (
                  <div
                    key={alerta.id}
                    className={`border rounded-xl p-4 flex gap-4 transition-all hover:shadow-xs relative group ${
                      alerta.leido 
                        ? 'bg-surface-lowest border-outline-variant/60' 
                        : 'bg-primary-container/5 border-primary/25 shadow-xs'
                    }`}
                  >
                    {/* Badge lateral tipo */}
                    <div className="shrink-0">
                      <span className={`inline-flex items-center justify-center min-w-[3.5rem] h-8 px-2.5 rounded-lg text-[9px] font-black tracking-wider uppercase border select-none ${badgeColor}`}>
                        {alerta.habitacionNumero}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs md:text-sm text-on-surface-variant leading-relaxed ${!alerta.leido ? 'font-bold text-on-surface' : ''}`}>
                        {alerta.mensaje}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 select-none">
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 font-semibold">
                          <Clock className="h-3 w-3" />
                          <span>{formatHoraExacta(alerta.timestamp)}</span>
                        </div>

                        {/* Botón de acción para Liberar Habitación si es Admin o Supervisor */}
                        {(usuario?.rol === 'admin' || usuario?.rol === 'supervisor') && 
                         alerta.habitacionNumero && 
                         !['CAJA', 'EGRESO', 'AUDITORÍA', 'SISTEMA'].includes(alerta.habitacionNumero) && (
                          <button
                            onClick={() => handleLiberarHabitacion(alerta.habitacionNumero.replace(/\D/g, ''), alerta.id)}
                            disabled={liberandoHab === alerta.habitacionNumero.replace(/\D/g, '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {liberandoHab === alerta.habitacionNumero.replace(/\D/g, '') ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Liberando...
                              </>
                            ) : (
                              <>
                                <KeyRound className="h-3.5 w-3.5" />
                                Liberar Hab. {alerta.habitacionNumero}
                              </>
                            )}
                          </button>
                        )}

                        {!alerta.leido && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-error/15 text-error">
                            Nuevo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón marcar leído */}
                    {!alerta.leido && (
                      <button
                        onClick={() => marcarComoLeida(alerta.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-primary hover:bg-primary-container/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        title="Marcar como leído"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
