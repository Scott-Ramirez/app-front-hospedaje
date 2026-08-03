import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const { notificaciones, conteoNoLeidas, marcarComoLeida, limpiarTodas } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú si hacen clic fuera de la campanita
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de la Campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer focus:outline-none"
      >
        <Bell className="h-4 w-4" />
        
        {conteoNoLeidas > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white animate-pulse">
            {conteoNoLeidas}
          </span>
        )}
      </button>

      {/* Desplegable Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-outline-variant bg-surface-lowest shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
          
          {/* Cabecera del panel */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-outline-variant">
            <h3 className="font-semibold text-on-surface flex items-center gap-2 text-sm">
              Notificaciones
              {conteoNoLeidas > 0 && (
                <span className="px-2 py-0.5 text-xs bg-error-container text-error rounded-full font-medium">
                  {conteoNoLeidas} nuevas
                </span>
              )}
            </h3>
            {notificaciones.length > 0 && (
              <button
                onClick={limpiarTodas}
                className="text-xs text-on-surface-variant hover:text-error flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar todo
              </button>
            )}
          </div>

          {/* Cuerpo de Alertas */}
          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="p-3 bg-surface-container rounded-full text-on-surface-variant/40 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-on-surface">¡Sin notificaciones!</p>
                <p className="text-[11px] text-on-surface-variant/70 mt-0.5">No hay alertas nuevas en tu bandeja.</p>
              </div>
            ) : (
              notificaciones.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3 flex gap-3 transition-colors ${
                    alerta.leido ? 'bg-surface-lowest' : 'bg-primary-container/5'
                  }`}
                >
                  {/* Número de Habitación o Etiqueta */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="min-w-[2rem] h-8 px-2 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-extrabold text-[8px] uppercase tracking-wider border border-outline-variant">
                      {alerta.habitacionNumero}
                    </div>
                  </div>

                  {/* Detalle del Mensaje */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-on-surface-variant ${!alerta.leido && 'font-medium text-on-surface'}`}>
                      {alerta.mensaje}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-on-surface-variant/50" />
                      <span className="text-[11px] text-on-surface-variant/50">
                        {new Date(alerta.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Acción Marcar como Leído */}
                  {!alerta.leido && (
                    <div className="flex-shrink-0 self-center pl-1">
                      <button
                        onClick={() => marcarComoLeida(alerta.id)}
                        className="h-2 w-2 rounded-full bg-primary hover:bg-primary-dim transition-all cursor-pointer"
                        title="Marcar como leído"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};