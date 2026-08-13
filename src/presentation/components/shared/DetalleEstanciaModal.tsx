import { useState, useEffect } from 'react';
import { 
  X, BedDouble, CreditCard, 
  Lock, Unlock, Loader2, CheckCircle2, AlertCircle,
  Clock, Hash, LogOut
} from 'lucide-react';
import { SolesIcon } from './SolesIcon';
import { estanciasRepository } from '../../../data/repositories/estancias.repository';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { useCajaSesion } from '../../context/CajaSesionContext';

interface DetalleEstanciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  estancia: any;
  onCheckOut: (id: string, numeroHabitacion: string) => Promise<void> | void;
  onRefreshList: () => void;
}

export const DetalleEstanciaModal = ({ isOpen, onClose, estancia, onCheckOut, onRefreshList }: DetalleEstanciaModalProps) => {
  const { verificarCaja } = useCajaSesion();
  const [loadingDeuda, setLoadingDeuda] = useState(true);
  const [totalPagos, setTotalPagos] = useState<number>(0);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [submittingPago, setSubmittingPago] = useState(false);

  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return '---';
    return new Date(fechaStr).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const cargarDeudaRealTime = async () => {
    try {
      setLoadingDeuda(true);
      const res = await estanciasRepository.obtenerDeuda(estancia.id);
      setTotalPagos(res.totalPagos ?? 0);
    } catch (err) {
      console.error('Error al cargar saldo:', err);
    } finally {
      setLoadingDeuda(false);
    }
  };

  useEffect(() => {
    if (isOpen && estancia?.id) {
      cargarDeudaRealTime();
      setMontoPago('');
      setMetodoPago('');
    }
  }, [isOpen, estancia]);

  if (!isOpen || !estancia) return null;

  const totalCalculado = Number(estancia.montoAcumulado ?? estancia.total_pagar) || 0;
  const deudaReal = Math.max(0, totalCalculado - totalPagos);
  const porcentajePagado = totalCalculado > 0 ? Math.min(100, (totalPagos / totalCalculado) * 100) : 100;
  const alDia = deudaReal === 0;

  const handlePagarSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoPago);
    if (isNaN(monto) || monto <= 0) { AlertAdapter.error('Monto Inválido', 'Ingrese un monto mayor a 0 soles.'); return; }
    if (monto > deudaReal) { AlertAdapter.error('Monto Excedido', 'El abono no puede superar la deuda pendiente.'); return; }
    if (!metodoPago) { AlertAdapter.error('Falta Información', 'Seleccione un método de pago.'); return; }
    try {
      setSubmittingPago(true);
      await estanciasRepository.registrarPago(estancia.id, { monto, metodoPago, concepto: 'Abono de saldo de estancia' });
      AlertAdapter.success('Pago Registrado', `Se registró el abono de S/. ${monto.toFixed(2)} correctamente.`);
      setMontoPago('');
      setMetodoPago('');
      await cargarDeudaRealTime();
      await verificarCaja(true);
      onRefreshList();
    } catch (err: any) {
      AlertAdapter.error('Error al registrar pago', err.response?.data?.message || 'No se pudo registrar el pago.');
    } finally {
      setSubmittingPago(false);
    }
  };

  const handleActionCheckout = async () => {
    await onCheckOut(estancia.id, estancia.habitacion?.numero || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/75 backdrop-blur-sm">
      <div className="bg-surface text-on-surface w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className={`px-6 pt-5 pb-4 border-b border-outline-variant flex items-start justify-between gap-4 ${alDia ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
          <div className="flex items-center gap-3">
            {/* Avatar habitación */}
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-black text-lg ${alDia ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
              {estancia.habitacion?.numero || '?'}
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface leading-tight">
                {estancia.huesped?.nombre || 'Huésped Anónimo'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                DNI {estancia.huesped?.dni || '---'}
                {estancia.huesped?.celular && <span className="ml-2 not-italic">· {estancia.huesped.celular}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Badge estado */}
            {alDia ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Al día
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                <AlertCircle className="h-3 w-3" /> Deuda activa
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Info strip: habitación + datos de estancia en una fila */}
          <div className="bg-surface-container rounded-xl border border-outline-variant/60 overflow-hidden">
            {/* Cabecera con habitación */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BedDouble className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Habitación {estancia.habitacion?.numero || '---'}</p>
                  <p className="text-[11px] text-on-surface-variant capitalize">{estancia.habitacion?.tipo || 'Estándar'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                S/. {Number(estancia.habitacion?.precio || 0).toFixed(2)}<span className="font-normal text-on-surface-variant">/noche</span>
              </span>
            </div>

            {/* Métricas de estancia en fila */}
            <div className="grid grid-cols-3 divide-x divide-outline-variant/40">
              <div className="px-4 py-3 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Check-In</span>
                <span className="text-xs font-semibold text-on-surface">{formatFecha(estancia.fecha_entrada)}</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Noches</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {estancia.diasTranscurridos ?? 1}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Total Est.</span>
                <span className="text-xs font-bold text-on-surface">
                  S/. {(Number(estancia.habitacion?.precio || 0) * (estancia.diasTranscurridos ?? 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Balance de cuenta ──────────────────────────────── */}
          <div className="bg-surface-container rounded-xl border border-outline-variant/60 overflow-hidden">
            <div className="px-4 pt-3.5 pb-2 border-b border-outline-variant/40">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Resumen de cuenta</p>
            </div>

            {loadingDeuda ? (
              <div className="py-6 flex items-center justify-center gap-2 text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs">Actualizando saldo...</span>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Tres métricas */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-surface rounded-lg p-2.5 border border-outline-variant/40">
                    <p className="text-[9px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1">Total</p>
                    <p className="text-sm font-black text-on-surface">S/. {totalCalculado.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-500/8 rounded-lg p-2.5 border border-emerald-500/20">
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide mb-1">Pagado</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/. {totalPagos.toFixed(2)}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 border ${deudaReal > 0 ? 'bg-red-500/8 border-red-500/20' : 'bg-emerald-500/8 border-emerald-500/20'}`}>
                    <p className={`text-[9px] font-semibold uppercase tracking-wide mb-1 ${deudaReal > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Saldo</p>
                    <p className={`text-sm font-black ${deudaReal > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>S/. {deudaReal.toFixed(2)}</p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                    <span>Progreso de pago</span>
                    <span>{porcentajePagado.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden border border-outline-variant/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${alDia ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${porcentajePagado}%` }}
                    />
                  </div>
                </div>

                {/* Banner estado */}
                {alDia ? (
                  <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span><strong>¡Cuenta saldada!</strong> El huésped está habilitado para check-out.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-lg px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span><strong>Deuda pendiente:</strong> Registrar cobro de <strong>S/. {deudaReal.toFixed(2)}</strong> antes del check-out.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Formulario de pago ─────────────────────────────── */}
          {!loadingDeuda && deudaReal > 0 && (
            <form onSubmit={handlePagarSaldo} className="bg-surface-container rounded-xl border border-outline-variant/60 overflow-hidden">
              <div className="px-4 pt-3.5 pb-2 border-b border-outline-variant/40 flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Registrar pago</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                      <SolesIcon className="h-3 w-3" /> Monto (S/.)
                    </label>
                    <input
                      type="number" required min="0.01" max={deudaReal} step="0.01"
                      placeholder={deudaReal.toFixed(2)}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-on-surface font-mono placeholder:text-on-surface-variant/40"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Método
                    </label>
                    <select
                      required
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-on-surface cursor-pointer"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="yape">Yape</option>
                      <option value="plin">Plin</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit" disabled={submittingPago}
                  className="w-full bg-primary text-on-primary font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPago ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Registrando...</span></>
                  ) : (
                    <><CreditCard className="h-4 w-4" /><span>Confirmar Pago</span></>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold">
            {deudaReal > 0 ? (
              <span className="flex items-center gap-1 text-red-500">
                <Lock className="h-3 w-3" /> Check-out bloqueado por deuda
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <Unlock className="h-3 w-3" /> Habilitado para salida
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleActionCheckout}
              disabled={deudaReal > 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-error text-on-error rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title={deudaReal > 0 ? 'Salde la cuenta primero' : 'Finalizar estancia'}
            >
              <LogOut className="h-3.5 w-3.5" />
              Check-Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
