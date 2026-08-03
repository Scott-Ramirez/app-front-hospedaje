import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Clock, CheckCircle2, XCircle, Loader2, ChevronDown,
  ChevronUp, ImageIcon, FileText, RefreshCw, AlertCircle, User, X
} from 'lucide-react';
import { solicitudEgresoRepository } from '../../../data/repositories/solicitudEgreso.repository';
import type { SolicitudEgreso } from '../../../data/repositories/solicitudEgreso.repository';

interface Props {
  onClose?: () => void;
}

const ESTADO_BADGE = {
  pendiente: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  aprobado:  'bg-green-500/15 text-green-600 border-green-500/30',
  rechazado: 'bg-error/15 text-error border-error/30',
};

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aprobado:  'Aprobado',
  rechazado: 'Rechazado',
};

export const SolicitudesEgresoPanel: React.FC<Props> = ({ onClose }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudEgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazandoId, setRechazandoId] = useState<string | null>(null);
  const [imagenModal, setImagenModal] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await solicitudEgresoRepository.listar();
      setSolicitudes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAprobar = async (id: string) => {
    setProcesandoId(id);
    try {
      await solicitudEgresoRepository.aprobar(id);
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (id: string) => {
    setProcesandoId(id);
    try {
      await solicitudEgresoRepository.rechazar(id, motivoRechazo);
      setRechazandoId(null);
      setMotivoRechazo('');
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  };

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const resueltas  = solicitudes.filter(s => s.estado !== 'pendiente');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-black text-sm text-on-surface">Solicitudes de Egreso</h2>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Aprobar o rechazar retiros de caja solicitados por recepcionistas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors">
            <RefreshCw className={`h-4 w-4 text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors">
              <X className="h-4 w-4 text-on-surface-variant" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* PENDIENTES */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Pendientes de revisión
                {pendientes.length > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto">
                    {pendientes.length}
                  </span>
                )}
              </h3>

              {pendientes.length === 0 ? (
                <div className="text-center py-6 text-xs text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  No hay solicitudes pendientes
                </div>
              ) : (
                pendientes.map(s => (
                  <SolicitudCard
                    key={s.id}
                    solicitud={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onAprobar={() => handleAprobar(s.id)}
                    onIniciarRechazo={() => setRechazandoId(s.id)}
                    procesando={procesandoId === s.id}
                    onVerImagen={setImagenModal}
                  />
                ))
              )}
            </div>

            {/* RESUELTAS */}
            {resueltas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Historial resuelto
                </h3>
                {resueltas.map(s => (
                  <SolicitudCard
                    key={s.id}
                    solicitud={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onVerImagen={setImagenModal}
                    readonly
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de rechazo */}
      {rechazandoId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant/60 p-6 space-y-4">
            <div className="flex items-center gap-2 text-error font-black text-sm">
              <XCircle className="h-5 w-5" />
              <span>Rechazar Solicitud</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Indica al recepcionista el motivo del rechazo (opcional).
            </p>
            <textarea
              rows={3}
              placeholder="Motivo del rechazo..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-error/20 resize-none"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRechazandoId(null); setMotivoRechazo(''); }}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRechazar(rechazandoId)}
                disabled={procesandoId === rechazandoId}
                className="flex-1 bg-error text-white font-black text-xs py-2 rounded-xl hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesandoId === rechazandoId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox de imagen */}
      {imagenModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setImagenModal(null)}
        >
          <img
            src={imagenModal}
            alt="boleta"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => setImagenModal(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Tarjeta individual de solicitud ─────────────────────────────────────────
interface CardProps {
  solicitud: SolicitudEgreso;
  expanded: boolean;
  onToggle: () => void;
  onAprobar?: () => void;
  onIniciarRechazo?: () => void;
  procesando?: boolean;
  readonly?: boolean;
  onVerImagen?: (url: string) => void;
}

const SolicitudCard: React.FC<CardProps> = ({
  solicitud: s, expanded, onToggle, onAprobar, onIniciarRechazo, procesando, readonly, onVerImagen,
}) => {
  const isPdf = s.imagenUrl?.endsWith('.pdf');
  const imagenFullUrl = s.imagenUrl ? solicitudEgresoRepository.getImagenUrl(s.imagenUrl) : null;

  return (
    <div className={`bg-surface-container rounded-2xl border overflow-hidden transition-all ${
      s.estado === 'pendiente' ? 'border-amber-500/30' : 'border-outline-variant/30'
    }`}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
          s.estado === 'pendiente' ? 'bg-amber-500/10' : s.estado === 'aprobado' ? 'bg-green-500/10' : 'bg-error/10'
        }`}>
          {s.estado === 'pendiente'  && <Clock className="h-4 w-4 text-amber-500" />}
          {s.estado === 'aprobado'   && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {s.estado === 'rechazado'  && <XCircle className="h-4 w-4 text-error" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-xs text-on-surface truncate">{s.concepto}</span>
            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ESTADO_BADGE[s.estado]}`}>
              {ESTADO_LABEL[s.estado]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <User className="h-3 w-3 text-on-surface-variant" />
            <span className="text-[10px] text-on-surface-variant">{s.usuarioNombre}</span>
            <span className="text-[10px] text-on-surface-variant/50">·</span>
            <span className="text-[10px] text-on-surface-variant">{new Date(s.fecha).toLocaleString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-black font-mono text-sm text-on-surface">S/. {Number(s.monto).toFixed(2)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/30 pt-3">
          {s.descripcion && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-xs text-on-surface">{s.descripcion}</p>
            </div>
          )}

          {/* Boleta */}
          {imagenFullUrl && (
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Boleta adjunta</p>
              {isPdf ? (
                <a
                  href={imagenFullUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold text-primary">Ver PDF adjunto</span>
                </a>
              ) : (
                <img
                  src={imagenFullUrl}
                  alt="boleta"
                  className="w-full max-h-40 object-cover rounded-xl cursor-zoom-in border border-outline-variant/30"
                  onClick={() => onVerImagen?.(imagenFullUrl)}
                />
              )}
            </div>
          )}

          {!imagenFullUrl && (
            <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl">
              <ImageIcon className="h-4 w-4 text-on-surface-variant/50" />
              <span className="text-[10px] text-on-surface-variant/70">Sin boleta adjunta</span>
            </div>
          )}

          {/* Rechazo info */}
          {s.estado === 'rechazado' && s.motivoRechazo && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-error mb-0.5">Motivo del rechazo</p>
                <p className="text-xs text-error/80">{s.motivoRechazo}</p>
              </div>
            </div>
          )}

          {s.estado !== 'pendiente' && s.aprobadoPorNombre && (
            <p className="text-[10px] text-on-surface-variant">
              {s.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'} por <strong>{s.aprobadoPorNombre}</strong>
              {s.fechaResolucion ? ` · ${new Date(s.fechaResolucion).toLocaleString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}` : ''}
            </p>
          )}

          {/* Acciones */}
          {!readonly && s.estado === 'pendiente' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={onIniciarRechazo}
                disabled={procesando}
                className="flex-1 py-2.5 rounded-xl border border-error/30 text-error text-xs font-black hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
              <button
                onClick={onAprobar}
                disabled={procesando}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-black hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Aprobar y Descontar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
