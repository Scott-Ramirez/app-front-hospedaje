import { useState, useEffect } from 'react';
import { X, User, BedDouble, Calendar, Coins, CreditCard, Lock, Unlock, Loader2, CheckCircle, HelpCircle } from 'lucide-react';
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
  
  // Formulario de Pago de Saldo
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [submittingPago, setSubmittingPago] = useState(false);

  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return '---';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cargarDeudaRealTime = async () => {
    try {
      setLoadingDeuda(true);
      const res = await estanciasRepository.obtenerDeuda(estancia.id);
      setTotalPagos(res.totalPagos ?? 0);
    } catch (err) {
      console.error('Error al cargar saldo en tiempo real:', err);
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

  const totalCalculado = Number(estancia.montoAcumulado !== undefined ? estancia.montoAcumulado : estancia.total_pagar) || 0;
  const pagoRealizado = totalPagos;
  const deudaReal = Math.max(0, totalCalculado - totalPagos);

  const handlePagarSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoPago);

    if (isNaN(monto) || monto <= 0) {
      AlertAdapter.error('Monto Inválido', 'Ingrese un monto mayor a 0 soles.');
      return;
    }

    if (monto > deudaReal) {
      AlertAdapter.error('Monto Excedido', 'El abono no puede superar la deuda pendiente actual.');
      return;
    }

    if (!metodoPago) {
      AlertAdapter.error('Falta Información', 'Seleccione un método de pago.');
      return;
    }

    try {
      setSubmittingPago(true);
      await estanciasRepository.registrarPago(estancia.id, {
        monto,
        metodoPago,
        concepto: 'Abono de saldo de estancia'
      });
      AlertAdapter.success('Pago Registrado', `Se registró el abono de S/. ${monto.toFixed(2)} correctamente.`);
      setMontoPago('');
      setMetodoPago('');
      
      // Refrescar deuda y notificar al padre
      await cargarDeudaRealTime();
      await verificarCaja(true); // Sincronizar caja
      onRefreshList();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo registrar el pago.';
      AlertAdapter.error('Error al registrar pago', msg);
    } finally {
      setSubmittingPago(false);
    }
  };

  const handleActionCheckout = async () => {
    await onCheckOut(estancia.id, estancia.habitacion?.numero || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-md animate-fade-in duration-200">
      <div className="bg-surface text-on-surface w-full max-w-xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* Glow decorativo de fondo */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[35%] bg-gradient-to-b from-primary/5 to-transparent blur-3xl pointer-events-none" />

        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest relative z-10">
          <div>
            <h3 className="text-lg font-black tracking-tight text-primary flex items-center gap-2">
              <Coins className="h-5 w-5" /> Ficha de Control de Estancia
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Consulta de estados de cuenta, detalles del huésped y liquidación de deudas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido / Cuerpo */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 relative z-10">
          
          {/* Fila 1: Habitación y Huésped */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Habitación Card */}
            <div className="bg-surface-container-low border border-outline-variant/65 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" /> Detalles de Habitación
              </span>
              <div className="text-left">
                <p className="text-base font-black text-on-surface">
                  Habitación {estancia.habitacion?.numero || '---'}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tipo: <strong className="capitalize">{estancia.habitacion?.tipo || 'Estándar'}</strong>
                </p>
                <p className="text-xs text-on-surface-variant">
                  Precio por noche: <strong>S/. {Number(estancia.habitacion?.precio || 0).toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Huésped Card */}
            <div className="bg-surface-container-low border border-outline-variant/65 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Ficha de Huésped
              </span>
              <div className="text-left">
                <p className="text-base font-black text-on-surface truncate">
                  {estancia.huesped?.nombre || 'Huésped Anónimo'}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  DNI: <strong className="font-mono">{estancia.huesped?.dni || '---'}</strong>
                </p>
                <p className="text-xs text-on-surface-variant">
                  Celular: <strong className="font-mono">{estancia.huesped?.celular || 'Sin número'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Fila 2: Línea de tiempo de la estancia */}
          <div className="bg-surface-container-low border border-outline-variant/65 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Línea de Tiempo de Estancia
            </span>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider block">Fecha Entrada</span>
                <span className="text-xs font-bold text-on-surface">{formatFecha(estancia.fecha_entrada)}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider block">Salida Programada</span>
                <span className="text-xs font-bold text-on-surface">{formatFecha(estancia.fecha_salida_programada)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Duración de Ocupación:</span>
              <span className="font-bold text-primary">
                {estancia.diasTranscurridos} {estancia.diasTranscurridos === 1 ? 'día transcurrido' : 'días transcurridos'}
              </span>
            </div>
          </div>

          {/* Fila 3: Balance Económico */}
          <div className="bg-surface-container/40 border border-outline-variant rounded-xl p-5 relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/60 pb-2 mb-3">
              Resumen de Cuenta del Hospedaje
            </h4>
            
            {loadingDeuda ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-on-surface-variant font-medium">Actualizando saldo...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-lowest border border-outline-variant/40 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Estancia</span>
                    <span className="text-sm font-black text-on-surface">S/. {totalCalculado.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Monto Pagado</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/. {pagoRealizado.toFixed(2)}</span>
                  </div>
                  <div className={`${deudaReal > 0 ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-green-500/5 border border-green-500/20 text-green-600'} rounded-lg p-2.5`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider block">Saldo Pendiente</span>
                    <span className="text-sm font-black">S/. {deudaReal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Mensaje de estado de cuenta */}
                {deudaReal === 0 ? (
                  <div className="bg-green-500/10 border border-green-500/20 px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span><strong>¡Cuenta al día!</strong> El huésped no registra deudas. Está habilitado para la salida del hotel.</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                    <HelpCircle className="h-4.5 w-4.5 shrink-0" />
                    <span><strong>Deuda pendiente:</strong> Requiere registrar un abono de <strong>S/. {deudaReal.toFixed(2)}</strong> antes de liberar el cuarto.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fila 4: Formulario de Registro de Pagos (Solo si hay deuda) */}
          {!loadingDeuda && deudaReal > 0 && (
            <form onSubmit={handlePagarSaldo} className="border border-outline-variant bg-surface-lowest p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Registrar Cobro / Abono Manual
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Monto a Abonar (S/.)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={deudaReal}
                    step="0.01"
                    placeholder={`S/. ${deudaReal.toFixed(2)}`}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-mono"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Método de Pago</label>
                  <select
                    required
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface cursor-pointer"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="" className="bg-surface text-on-surface">Seleccione...</option>
                    <option value="efectivo" className="bg-surface text-on-surface">Efectivo</option>
                    <option value="yape" className="bg-surface text-on-surface">Yape</option>
                    <option value="plin" className="bg-surface text-on-surface">Plin</option>
                    <option value="tarjeta" className="bg-surface text-on-surface">Tarjeta</option>
                    <option value="transferencia" className="bg-surface text-on-surface">Transferencia</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingPago}
                className="w-full bg-primary text-on-primary font-bold text-xs py-2 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingPago ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registrando transacción...</span>
                  </>
                ) : (
                  <span>Registrar Pago / Cobro</span>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Pie del Modal / Botón de Acción Principal (Check-out) */}
        <div className="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest relative z-10 select-none">
          <div className="text-left sm:max-w-xs">
            {deudaReal > 0 ? (
              <span className="text-[10px] font-bold text-error flex items-center gap-1 animate-pulse">
                <Lock className="h-3 w-3" /> Check-out bloqueado por deuda activa.
              </span>
            ) : (
              <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                <Unlock className="h-3 w-3" /> Habilitado para dar de baja / salida.
              </span>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleActionCheckout}
              disabled={deudaReal > 0}
              className="px-5 py-2.5 text-xs font-black bg-error text-on-error rounded-lg hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-error/15"
              title={deudaReal > 0 ? 'Debe saldar la cuenta primero' : 'Finalizar estancia y desocupar habitación'}
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Dar Salida (Check-Out)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
