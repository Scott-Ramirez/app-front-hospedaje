import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, IdCard, X, Ban, ArrowRight, Image as ImageIcon, ExternalLink, Eye } from 'lucide-react';
import type { ReservaDTO } from '../../../data/repositories/reservas.repository';
import { ReservasRepository } from '../../../data/repositories/reservas.repository';

interface DetalleReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: ReservaDTO | null;
  onCheckIn: (id: string) => Promise<void>;
  onCancelar: (id: string) => Promise<void>;
}

const reservasRepo = new ReservasRepository();

export const DetalleReservaModal: React.FC<DetalleReservaModalProps> = ({
  isOpen,
  onClose,
  reserva,
  onCheckIn,
  onCancelar,
}) => {
  const [modalEvidenciaAbierto, setModalEvidenciaAbierto] = useState<boolean>(false);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalEvidenciaAbierto) {
          setModalEvidenciaAbierto(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalEvidenciaAbierto, onClose]);

  if (!isOpen || !reserva) return null;

  const inicioFormatted = new Date(reserva.fecha_inicio).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const finFormatted = new Date(reserva.fecha_fin).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const inicioDate = new Date(reserva.fecha_inicio);
  const finDate = new Date(reserva.fecha_fin);
  const diffMs = finDate.getTime() - inicioDate.getTime();
  const diffHoras = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 24;
  const diasEstadia = Math.max(1, Math.ceil(diffHoras / 24));

  const totalEstimado = Number(reserva.monto_total_estimado) || Number(reserva.monto_adelanto) || 0;
  const abono = Number(reserva.monto_adelanto) || 0;
  const saldoPendiente = Math.max(0, totalEstimado - abono);

  const comprobanteFullUrl = reserva.comprobante_url ? reservasRepo.getComprobanteUrl(reserva.comprobante_url) : null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-surface border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-on-surface max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* HEADER (FIJO) */}
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Detalle de Reserva</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Cerrar ventana (Esc)"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* CONTENIDO (SCROLLABLE) */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* BADGE HABITACIÓN */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Habitación Reservada</p>
                <h4 className="text-2xl font-black text-on-surface">
                  Nº {reserva.habitacion?.numero || 'N/A'}
                </h4>
                <p className="text-xs text-on-surface-variant capitalize">
                  {reserva.habitacion?.tipo === 'simple' ? 'Habitación Simple' : 'Habitación Doble'}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  reserva.estado === 'confirmada' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                  reserva.estado === 'completada' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                  'bg-red-500/20 text-red-700 dark:text-red-400'
                }`}>
                  {reserva.estado}
                </span>
              </div>
            </div>

            {/* DATOS HUÉSPED */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Datos del Cliente</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                <span>{reserva.huesped?.nombre || reserva.nombre || 'Sin nombre'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <IdCard className="h-3.5 w-3.5" /> DNI: {reserva.huesped?.dni || reserva.dni || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Cel: {reserva.huesped?.celular || reserva.celular || 'N/A'}
                </span>
              </div>
            </div>

            {/* RANGO DE FECHAS Y DURACIÓN */}
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-outline-variant/50 pb-2">
                <span className="font-bold text-on-surface-variant uppercase">Duración de Reserva:</span>
                <span className="font-black text-primary text-sm">
                  {diasEstadia} {diasEstadia === 1 ? 'día / noche' : 'días / noches'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-bold text-on-surface-variant uppercase text-[10px]">Fecha Inicio</p>
                  <p className="font-semibold text-on-surface mt-0.5">{inicioFormatted}</p>
                </div>
                <div>
                  <p className="font-bold text-on-surface-variant uppercase text-[10px]">Fecha Fin (Check-out)</p>
                  <p className="font-semibold text-on-surface mt-0.5">{finFormatted}</p>
                </div>
              </div>
            </div>

            {/* DETALLE FINANCIERO: TOTAL, ABONO Y SALDO */}
            <div className="p-3.5 bg-surface-container-lowest border border-primary/20 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Monto Total de la Reserva:</span>
                <span className="text-base font-black text-on-surface">S/. {totalEstimado.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                <div>
                  <span className="font-bold text-green-700 dark:text-green-400 block">Abono / Anticipo Pagado:</span>
                  <span className="text-[10px] text-on-surface-variant capitalize">Método: {reserva.metodo_pago}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-green-600 dark:text-green-400 block">
                    S/. {abono.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-outline-variant/40">
                <span className="text-on-surface-variant font-medium">Saldo Pendiente al Check-In:</span>
                <span className={`text-sm font-black ${saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  S/. {saldoPendiente.toFixed(2)}
                </span>
              </div>
            </div>

            {/* SECCIÓN COMPROBANTE / CAPTURA ADJUNTA */}
            {comprobanteFullUrl && (
              <div className="p-3 bg-primary/5 border border-primary/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Comprobante de Pago Digital</p>
                    <p className="text-[10px] text-on-surface-variant">Captura adjunta al registrar la reserva ({reserva.metodo_pago.toUpperCase()})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalEvidenciaAbierto(true)}
                  className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" /> Ver Captura
                </button>
              </div>
            )}

            {reserva.observaciones && (
              <div className="text-xs text-on-surface-variant italic bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/40">
                "{reserva.observaciones}"
              </div>
            )}

          </div>

          {/* FOOTER (SIEMPRE VISIBLE EN LA BASE) */}
          <div className="p-4 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between shrink-0">
            {reserva.estado === 'confirmada' ? (
              <button
                type="button"
                onClick={() => onCancelar(reserva.id!)}
                className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="h-4 w-4" /> Cancelar Reserva
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-on-surface bg-surface-container-high hover:bg-outline-variant/70 border border-outline-variant rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Cerrar Ventana
              </button>
              
              {reserva.estado === 'confirmada' && (
                <button
                  type="button"
                  onClick={() => onCheckIn(reserva.id!)}
                  className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Procesar Check-In <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL VISOR DE CAPTURA / COMPROBANTE */}
      {modalEvidenciaAbierto && comprobanteFullUrl && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setModalEvidenciaAbierto(false)}
        >
          <div 
            className="bg-surface border border-outline-variant rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
              <span className="font-bold text-sm text-on-surface flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Captura / Comprobante de Pago ({reserva.metodo_pago.toUpperCase()})
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={comprobanteFullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-surface-container-high hover:bg-outline-variant text-on-surface text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir Original
                </a>
                <button
                  type="button"
                  onClick={() => setModalEvidenciaAbierto(false)}
                  className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/20 rounded-xl p-2">
              {comprobanteFullUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={comprobanteFullUrl}
                  className="w-full h-[60vh] rounded-lg"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={comprobanteFullUrl}
                  alt="Captura de Pago"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

