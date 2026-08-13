import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt, Clock, CheckCircle2, XCircle, Loader2, ChevronDown,
  ChevronUp, ImageIcon, FileText, RefreshCw, AlertCircle, User, X,
  ShieldCheck, PackageCheck, Upload
} from 'lucide-react';
import { SolesIcon } from './SolesIcon';
import { solicitudEgresoRepository } from '../../../data/repositories/solicitudEgreso.repository';
import type { SolicitudEgreso } from '../../../data/repositories/solicitudEgreso.repository';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { useAuth } from '../../context/AuthContext';
import { AdjuntarBoletaModal } from '../recepcion/AdjuntarBoletaModal';

interface Props {
  onClose?: () => void;
}

const ESTADO_BADGE: Record<SolicitudEgreso['estado'], string> = {
  pendiente:    'bg-amber-500/15 text-amber-600 border-amber-500/30',
  pre_aprobado: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  liquidado:    'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rechazado:    'bg-red-500/15 text-red-500 border-red-500/30',
  aprobado:     'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

const ESTADO_LABEL: Record<SolicitudEgreso['estado'], string> = {
  pendiente:    'Pendiente',
  pre_aprobado: 'Pre-aprobado',
  liquidado:    'Liquidado',
  rechazado:    'Rechazado',
  aprobado:     'Aprobado (Legacy)',
};

export const SolicitudesEgresoPanel: React.FC<Props> = ({ onClose }) => {
  const { usuario } = useAuth();
  const isRecepcionista = usuario?.rol === 'recepcionista';

  const [solicitudes, setSolicitudes] = useState<SolicitudEgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazandoId, setRechazandoId] = useState<string | null>(null);
  const [liquidandoId, setLiquidandoId] = useState<string | null>(null);
  const [imagenModal, setImagenModal] = useState<string | null>(null);
  const [solicitudAdjuntar, setSolicitudAdjuntar] = useState<SolicitudEgreso | null>(null);

  // Estado para liquidar manualmente
  const [montoLiquidar, setMontoLiquidar] = useState('');
  const [archivoLiquidar, setArchivoLiquidar] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handlePreAprobar = async (id: string) => {
    setProcesandoId(id);
    try {
      await solicitudEgresoRepository.preAprobar(id);
      AlertAdapter.success('Pre-aprobada', 'El recepcionista fue notificado para realizar la compra.');
      await cargar();
    } catch (err: any) {
      AlertAdapter.error('Error', err?.response?.data?.message || 'No se pudo pre-aprobar.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleLiquidar = async (solicitud: SolicitudEgreso) => {
    const monto = parseFloat(montoLiquidar) || solicitud.montoReal || solicitud.monto;
    if (isNaN(monto) || monto <= 0) {
      AlertAdapter.error('Monto inválido', 'Ingresa el monto real a liquidar.');
      return;
    }
    setProcesandoId(solicitud.id);
    try {
      const formData = new FormData();
      formData.append('montoReal', monto.toString());
      if (archivoLiquidar) formData.append('boleta', archivoLiquidar);
      await solicitudEgresoRepository.liquidar(solicitud.id, formData);
      AlertAdapter.success('Liquidado', `Egreso de S/. ${monto.toFixed(2)} registrado en caja.`);
      setLiquidandoId(null);
      setMontoLiquidar('');
      setArchivoLiquidar(null);
      await cargar();
    } catch (err: any) {
      AlertAdapter.error('Error', err?.response?.data?.message || 'No se pudo liquidar.');
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

  const pendientes    = solicitudes.filter(s => s.estado === 'pendiente');
  const preAprobadas  = solicitudes.filter(s => s.estado === 'pre_aprobado');
  const historial     = solicitudes.filter(s => s.estado === 'liquidado' || s.estado === 'rechazado');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-black text-sm text-on-surface">
              {isRecepcionista ? 'Mis Solicitudes de Egreso' : 'Gestión de Egresos'}
            </h2>
            <p className="text-[10px] text-on-surface-variant font-medium">
              {isRecepcionista ? (
                <span>Consulta el estado de tus solicitudes y adjunta boletas</span>
              ) : (
                <>
                  {pendientes.length > 0 && <span className="text-amber-500 font-bold">{pendientes.length} pendientes</span>}
                  {pendientes.length > 0 && preAprobadas.length > 0 && ' · '}
                  {preAprobadas.length > 0 && <span className="text-blue-500 font-bold">{preAprobadas.filter(s => s.boletaLiquidacionUrl).length} listas para liquidar</span>}
                  {pendientes.length === 0 && preAprobadas.length === 0 && 'Sin acciones pendientes'}
                </>
              )}
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
            {/* ── SECCIÓN 1: PENDIENTES DE PRE-APROBACIÓN ── */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
                title="Pendientes de pre-aprobación"
                count={pendientes.length}
                countColor="bg-amber-500"
              />
              {pendientes.length === 0 ? (
                <EmptyState text="No hay solicitudes nuevas" />
              ) : (
                pendientes.map(s => (
                  <SolicitudCard
                    key={s.id}
                    solicitud={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    acciones={
                      isRecepcionista ? (
                        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>Esperando pre-aprobación del administrador.</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRechazandoId(s.id)}
                            disabled={procesandoId === s.id}
                            className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rechazar
                          </button>
                          <button
                            onClick={() => handlePreAprobar(s.id)}
                            disabled={procesandoId === s.id}
                            className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {procesandoId === s.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <ShieldCheck className="h-3.5 w-3.5" />}
                            Pre-Aprobar
                          </button>
                        </div>
                      )
                    }
                  />
                ))
              )}
            </div>

            {/* ── SECCIÓN 2: PRE-APROBADAS (esperando boleta / listas para liquidar) ── */}
            <div className="space-y-3">
              <SectionHeader
                icon={<PackageCheck className="h-3.5 w-3.5 text-blue-500" />}
                title="Pre-aprobadas · En proceso de compra"
                count={preAprobadas.length}
                countColor="bg-blue-500"
              />
              {preAprobadas.length === 0 ? (
                <EmptyState text="No hay solicitudes en esta etapa" />
              ) : (
                preAprobadas.map(s => {
                  const tieneBoleta = Boolean(s.boletaLiquidacionUrl);
                  return (
                    <SolicitudCard
                      key={s.id}
                      solicitud={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      onVerImagen={setImagenModal}
                      badge={tieneBoleta
                        ? <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Boleta adjunta ✓</span>
                        : <span className="text-[9px] font-bold text-on-surface-variant/60 bg-surface-container px-1.5 py-0.5 rounded-full border border-outline-variant/40">Esperando boleta...</span>
                      }
                      acciones={
                        isRecepcionista ? (
                          tieneBoleta ? (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span>Boleta adjuntada. Esperando liquidación del administrador.</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSolicitudAdjuntar(s)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Upload className="h-4 w-4" />
                              Adjuntar Boleta de Compra (Paso 2)
                            </button>
                          )
                        ) : (
                          liquidandoId === s.id ? (
                            // Formulario inline de liquidación
                            <div className="space-y-3 pt-2 border-t border-outline-variant/40">
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Confirmar liquidación</p>
                              <div className="flex gap-2">
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-on-surface-variant uppercase">Monto real (S/.)</label>
                                  <input
                                    type="number" step="0.01" min="0.01"
                                    placeholder={(s.montoReal ?? s.monto).toFixed(2)}
                                    value={montoLiquidar}
                                    onChange={(e) => setMontoLiquidar(e.target.value)}
                                    className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                                {!tieneBoleta && (
                                  <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-on-surface-variant uppercase">Boleta (opcional)</label>
                                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => setArchivoLiquidar(e.target.files?.[0] ?? null)} />
                                    <button
                                      type="button"
                                      onClick={() => fileRef.current?.click()}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant hover:bg-surface-container-high cursor-pointer transition-colors"
                                    >
                                      <Upload className="h-3 w-3" />
                                      {archivoLiquidar ? archivoLiquidar.name.slice(0, 12) + '...' : 'Adjuntar'}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setLiquidandoId(null); setMontoLiquidar(''); setArchivoLiquidar(null); }}
                                  className="px-3 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleLiquidar(s)}
                                  disabled={procesandoId === s.id}
                                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                                >
                                  {procesandoId === s.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <CheckCircle2 className="h-3.5 w-3.5" />}
                                  Confirmar y Descontar de Caja
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRechazandoId(s.id)}
                                disabled={procesandoId === s.id}
                                className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Rechazar
                              </button>
                              <button
                                onClick={() => {
                                  setLiquidandoId(s.id);
                                  setMontoLiquidar((s.montoReal ?? s.monto).toFixed(2));
                                  setArchivoLiquidar(null);
                                }}
                                disabled={procesandoId === s.id}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <SolesIcon className="h-3.5 w-3.5" />
                                {tieneBoleta ? 'Liquidar' : 'Liquidar igualmente'}
                              </button>
                            </div>
                          )
                        )
                      }
                    />
                  );
                })
              )}
            </div>

            {/* ── SECCIÓN 3: HISTORIAL ── */}
            {historial.length > 0 && (
              <div className="space-y-3">
                <SectionHeader
                  icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  title="Historial"
                />
                {historial.map(s => (
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
            <div className="flex items-center gap-2 text-red-500 font-black text-sm">
              <XCircle className="h-5 w-5" />
              <span>Rechazar Solicitud</span>
            </div>
            <p className="text-xs text-on-surface-variant">Indica al recepcionista el motivo del rechazo (opcional).</p>
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

      {/* Modal de adjuntar boleta para recepcionista */}
      {solicitudAdjuntar && (
        <AdjuntarBoletaModal
          solicitud={solicitudAdjuntar}
          onClose={() => setSolicitudAdjuntar(null)}
          onSuccess={() => {
            setSolicitudAdjuntar(null);
            cargar();
          }}
        />
      )}
    </div>
  );
};

// ── Sub-componentes ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
  countColor?: string;
}> = ({ icon, title, count, countColor }) => (
  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
    {icon}
    {title}
    {count !== undefined && count > 0 && (
      <span className={`${countColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto`}>
        {count}
      </span>
    )}
  </h3>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-5 text-xs text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30">
    {text}
  </div>
);

interface CardProps {
  solicitud: SolicitudEgreso;
  expanded: boolean;
  onToggle: () => void;
  onVerImagen?: (url: string) => void;
  readonly?: boolean;
  acciones?: React.ReactNode;
  badge?: React.ReactNode;
}

const SolicitudCard: React.FC<CardProps> = ({
  solicitud: s, expanded, onToggle, onVerImagen, readonly, acciones, badge
}) => {
  const boletaUrl = s.boletaLiquidacionUrl
    ? solicitudEgresoRepository.getImagenUrl(s.boletaLiquidacionUrl)
    : s.imagenUrl
      ? solicitudEgresoRepository.getImagenUrl(s.imagenUrl)
      : null;

  const liquidacionUrl = s.boletaLiquidacionUrl
    ? solicitudEgresoRepository.getImagenUrl(s.boletaLiquidacionUrl)
    : null;

  const isPdf = boletaUrl?.endsWith('.pdf');

  return (
    <div className={`bg-surface-container rounded-2xl border overflow-hidden transition-all ${
      s.estado === 'pendiente' ? 'border-amber-500/30' :
      s.estado === 'pre_aprobado' ? 'border-blue-500/30' :
      s.estado === 'liquidado' ? 'border-emerald-500/20' :
      'border-outline-variant/30'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
          s.estado === 'pendiente'    ? 'bg-amber-500/10' :
          s.estado === 'pre_aprobado' ? 'bg-blue-500/10' :
          s.estado === 'liquidado'    ? 'bg-emerald-500/10' :
          'bg-error/10'
        }`}>
          {s.estado === 'pendiente'    && <Clock className="h-4 w-4 text-amber-500" />}
          {s.estado === 'pre_aprobado' && <ShieldCheck className="h-4 w-4 text-blue-500" />}
          {s.estado === 'liquidado'    && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {s.estado === 'rechazado'    && <XCircle className="h-4 w-4 text-error" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-xs text-on-surface truncate">{s.concepto}</span>
            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ESTADO_BADGE[s.estado]}`}>
              {ESTADO_LABEL[s.estado]}
            </span>
            {badge}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <User className="h-3 w-3 text-on-surface-variant" />
            <span className="text-[10px] text-on-surface-variant">{s.usuarioNombre}</span>
            <span className="text-[10px] text-on-surface-variant/50">·</span>
            <span className="text-[10px] text-on-surface-variant">
              {new Date(s.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            {s.montoReal !== undefined && s.montoReal !== null ? (
              <>
                <p className="font-black font-mono text-sm text-emerald-600">S/. {Number(s.montoReal).toFixed(2)}</p>
                <p className="text-[9px] text-on-surface-variant/60">est. {Number(s.monto).toFixed(2)}</p>
              </>
            ) : (
              <p className="font-black font-mono text-sm text-on-surface">S/. {Number(s.monto).toFixed(2)}</p>
            )}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/30 pt-3">
          {s.descripcion && (
            <div className="bg-surface-container-low rounded-xl p-3">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-xs text-on-surface">{s.descripcion}</p>
            </div>
          )}

          {/* Monto real vs estimado */}
          {s.estado === 'liquidado' && s.montoReal !== undefined && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface rounded-lg p-2 border border-outline-variant/40">
                <p className="text-[9px] text-on-surface-variant font-bold uppercase">Estimado</p>
                <p className="text-xs font-black text-on-surface">S/. {Number(s.monto).toFixed(2)}</p>
              </div>
              <div className="bg-emerald-500/8 rounded-lg p-2 border border-emerald-500/20">
                <p className="text-[9px] text-emerald-600 font-bold uppercase">Real</p>
                <p className="text-xs font-black text-emerald-600">S/. {Number(s.montoReal).toFixed(2)}</p>
              </div>
              <div className={`rounded-lg p-2 border ${Math.abs(Number(s.montoReal) - Number(s.monto)) < 0.01 ? 'bg-surface border-outline-variant/40' : 'bg-amber-500/8 border-amber-500/20'}`}>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase">Dif.</p>
                <p className={`text-xs font-black ${Math.abs(Number(s.montoReal) - Number(s.monto)) < 0.01 ? 'text-on-surface' : 'text-amber-600'}`}>
                  S/. {(Number(s.montoReal) - Number(s.monto)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Boleta de liquidación */}
          {liquidacionUrl && (
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Boleta de Liquidación</p>
              {liquidacionUrl.endsWith('.pdf') ? (
                <a href={liquidacionUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold text-primary">Ver PDF adjunto</span>
                </a>
              ) : (
                <img
                  src={liquidacionUrl} alt="boleta liquidación"
                  className="w-full max-h-40 object-cover rounded-xl cursor-zoom-in border border-outline-variant/30"
                  onClick={() => onVerImagen?.(liquidacionUrl)}
                />
              )}
            </div>
          )}

          {/* Boleta original (si es diferente a la de liquidación) */}
          {boletaUrl && boletaUrl !== liquidacionUrl && (
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Boleta Inicial</p>
              {isPdf ? (
                <a href={boletaUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs font-bold text-primary">Ver PDF adjunto</span>
                </a>
              ) : (
                <img
                  src={boletaUrl} alt="boleta"
                  className="w-full max-h-40 object-cover rounded-xl cursor-zoom-in border border-outline-variant/30"
                  onClick={() => onVerImagen?.(boletaUrl)}
                />
              )}
            </div>
          )}

          {!boletaUrl && !liquidacionUrl && (
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
              {s.estado === 'liquidado' ? 'Liquidado' : s.estado === 'pre_aprobado' ? 'Pre-aprobado' : 'Rechazado'}
              {' '}por <strong>{s.aprobadoPorNombre}</strong>
              {s.fechaResolucion ? ` · ${new Date(s.fechaResolucion).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          )}

          {/* Acciones */}
          {!readonly && acciones && <div className="pt-1">{acciones}</div>}
        </div>
      )}
    </div>
  );
};
