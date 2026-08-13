import React, { useState } from 'react';
import { X, Send, Bell, Shield, UserCheck, Loader2, BedDouble } from 'lucide-react';
import { notificacionRepository } from '../../../data/repositories/notificacion.repository';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';

interface EnviarNotificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitacionNumero?: string;
  estanciaId?: string;
}

export const EnviarNotificacionModal: React.FC<EnviarNotificacionModalProps> = ({
  isOpen,
  onClose,
  habitacionNumero,
  estanciaId,
}) => {
  const [destinatarioRol, setDestinatarioRol] = useState<'todos' | 'admin' | 'supervisor'>('todos');
  const [motivo, setMotivo] = useState(habitacionNumero ? 'Solicitar liberación de habitación' : 'Consulta de atención');
  const [mensajeAdicional, setMensajeAdicional] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const tituloFinal = habitacionNumero
        ? `🔔 ${motivo} - Hab. ${habitacionNumero}`
        : `🔔 ${motivo}`;

      const contenidoMensaje = mensajeAdicional.trim()
        ? `${motivo}. Nota: ${mensajeAdicional}`
        : `${motivo} para la habitación ${habitacionNumero || 'N/A'}. Favor revisar.`;

      await notificacionRepository.enviar({
        destinatarioRol,
        titulo: tituloFinal,
        mensaje: contenidoMensaje,
        tipo: motivo.toLowerCase().includes('liberación') ? 'liberacion_habitacion' : 'alerta',
        habitacionNumero,
        estanciaId,
      });

      AlertAdapter.success(
        'Notificación Enviada',
        `La alerta ha sido enviada exitosamente a la bandeja de ${
          destinatarioRol === 'todos'
            ? 'Administrador y Supervisor'
            : destinatarioRol === 'admin'
            ? 'Administrador'
            : 'Supervisor'
        }.`
      );

      setMensajeAdicional('');
      onClose();
    } catch (err: any) {
      AlertAdapter.error('Error al Enviar', err.response?.data?.message || 'No se pudo enviar la notificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-surface text-on-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface leading-tight">Enviar Notificación</h3>
              <p className="text-[10px] font-medium text-on-surface-variant">Notificar a la bandeja del equipo de supervisión</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-medium">
          
          {/* Habitación Tag si existe */}
          {habitacionNumero && (
            <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-primary font-bold">
              <BedDouble className="h-4 w-4" />
              <span>Habitación N° {habitacionNumero}</span>
            </div>
          )}

          {/* Selector Destinatario */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Destinatario (¿A quién notificar?)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDestinatarioRol('todos')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  destinatarioRol === 'todos'
                    ? 'bg-primary-container/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span className="text-[10px] text-center leading-tight">Todos (Ambos)</span>
              </button>

              <button
                type="button"
                onClick={() => setDestinatarioRol('admin')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  destinatarioRol === 'admin'
                    ? 'bg-primary-container/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="text-[10px] text-center leading-tight">Solo Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDestinatarioRol('supervisor')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  destinatarioRol === 'supervisor'
                    ? 'bg-primary-container/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span className="text-[10px] text-center leading-tight">Solo Supervisor</span>
              </button>
            </div>
          </div>

          {/* Motivo Preset */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Motivo / Asunto
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary text-on-surface cursor-pointer"
            >
              <option value="Solicitar liberación de habitación">🔑 Solicitar liberación de habitación</option>
              <option value="Revisión de abono / pago digital">💳 Revisión de abono / pago digital</option>
              <option value="Asistencia urgente en recepción">🚨 Asistencia urgente en recepción</option>
              <option value="Consulta sobre huésped">👤 Consulta sobre huésped</option>
              <option value="Notificación personalizada">💬 Notificación personalizada</option>
            </select>
          </div>

          {/* Mensaje adicional */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Mensaje o Detalles Adicionales (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Escriba un mensaje detallado para la bandeja de entrada..."
              value={mensajeAdicional}
              onChange={(e) => setMensajeAdicional(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar a Bandeja
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
