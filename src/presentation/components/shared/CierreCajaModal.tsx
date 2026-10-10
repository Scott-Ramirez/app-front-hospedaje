import React, { useState } from 'react';
import { useCajaSesion } from '../../context/CajaSesionContext';
import { X, Wallet, Info, Loader2, ArrowRight, ShieldCheck, Banknote, Users } from 'lucide-react';

interface CierreCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CierreCajaModal: React.FC<CierreCajaModalProps> = ({ isOpen, onClose }) => {
  const { cajaActiva, cerrarCaja } = useCajaSesion();
  const [montoReal, setMontoReal] = useState('');
  const [destino, setDestino] = useState<'admin_todo' | 'admin_parcial' | 'dejar_todo'>('admin_todo');
  const [fondoSencillo, setFondoSencillo] = useState('50.00');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !cajaActiva) return null;

  const inicial = Number(cajaActiva.monto_inicial);
  const ingresosEfectivo = Number(cajaActiva.monto_ingresos_efectivo || 0);
  const ingresosDigital = Number(cajaActiva.monto_ingresos_digital || 0);
  const egresos = Number(cajaActiva.monto_egresos);
  const esperadoFisico = inicial + ingresosEfectivo - egresos;

  const real = montoReal === '' ? 0 : Number(montoReal);
  const descuadre = real - esperadoFisico;

  // Cálculo según destino seleccionado
  let montoEntregadoAdmin = 0;
  let montoDejadoCaja = 0;

  if (destino === 'admin_todo') {
    montoEntregadoAdmin = Math.max(0, real);
    montoDejadoCaja = 0;
  } else if (destino === 'admin_parcial') {
    const fondo = Number(fondoSencillo) || 0;
    montoDejadoCaja = Math.min(real, Math.max(0, fondo));
    montoEntregadoAdmin = Math.max(0, real - montoDejadoCaja);
  } else {
    montoEntregadoAdmin = 0;
    montoDejadoCaja = Math.max(0, real);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoReal === '') return;

    setSubmitting(true);
    const success = await cerrarCaja(real, observaciones, montoEntregadoAdmin, montoDejadoCaja);
    if (!success) {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/70 backdrop-blur-md select-none overflow-y-auto p-4">
      
      {/* Caja del Modal */}
      <div className="bg-surface text-on-surface w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-outline-variant/60 flex flex-col gap-4 relative animate-fade-in my-auto">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-on-surface">Cierre de Caja y Arqueo</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">
                Turno iniciado: {new Date(cajaActiva.fecha_apertura).toLocaleDateString()} a las {new Date(cajaActiva.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desglose del Arqueo */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-surface-container-low border border-outline-variant/40 p-2 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block leading-none">Inicial</span>
            <p className="font-mono text-xs font-extrabold text-on-surface">S/. {inicial.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider block leading-none">Efectivo (+)</span>
            <p className="font-mono text-xs font-extrabold text-emerald-600">S/. {ingresosEfectivo.toFixed(2)}</p>
          </div>
          <div className="bg-error/5 border border-error/10 p-2 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] text-error uppercase font-bold tracking-wider block leading-none">Egresos (-)</span>
            <p className="font-mono text-xs font-extrabold text-error">S/. {egresos.toFixed(2)}</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-2 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] text-blue-600 uppercase font-bold tracking-wider block leading-none">Yape/Plin (★)</span>
            <p className="font-mono text-xs font-extrabold text-blue-600">S/. {ingresosDigital.toFixed(2)}</p>
          </div>
        </div>

        {/* Saldo Esperado Físico */}
        <div className="bg-surface-container border border-outline-variant/60 p-3 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5 text-left">
            <h4 className="text-xs font-black text-on-surface">Saldo Físico Esperado en Gaveta</h4>
            <p className="text-[10px] text-on-surface-variant font-medium leading-none">Monto que debe haber en efectivo (Inicial + Efectivo - Gastos).</p>
          </div>
          <span className="font-mono text-lg font-black text-primary">S/. {esperadoFisico.toFixed(2)}</span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* PASO 1: Conteo Físico */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              1. Conteo Físico Real en Gaveta (S/.)
            </label>
            <input
              type="number"
              required
              min="0.00"
              step="0.01"
              placeholder="0.00"
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-base font-black font-mono outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
            />
            <span className="text-[10px] text-on-surface-variant/70">
              Total de billetes y monedas contados actualmente en el cajón antes de retirar o traspasar.
            </span>
          </div>

          {/* Descuadre Dinámico */}
          {montoReal !== '' && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              Math.abs(descuadre) < 0.01
                ? 'bg-green-500/10 border-green-500/20 text-green-600'
                : descuadre < 0
                ? 'bg-error/10 border-error/20 text-error'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                <span>
                  {Math.abs(descuadre) < 0.01
                    ? '¡Turno perfectamente cuadrado!'
                    : descuadre < 0
                    ? 'Faltante detectado en turno'
                    : 'Sobrante detectado en turno'}
                </span>
              </div>
              <span className="font-mono text-sm font-black">
                {descuadre >= 0 ? '+' : ''}S/. {descuadre.toFixed(2)}
              </span>
            </div>
          )}

          {/* PASO 2: Destino del Dinero */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              2. Destino del Dinero (Liquidación de Turno)
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Opción 1: Todo a Admin */}
              <button
                type="button"
                onClick={() => setDestino('admin_todo')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  destino === 'admin_todo'
                    ? 'bg-primary/10 border-primary shadow-sm text-primary'
                    : 'bg-surface-container-low border-outline-variant/50 text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-black leading-tight">Admin lleva TODO</span>
                </div>
                <span className="text-[9px] text-on-surface-variant opacity-80 leading-snug">
                  Gaveta queda en S/. 0.00
                </span>
              </button>

              {/* Opción 2: Dejar Fondo de Cambio */}
              <button
                type="button"
                onClick={() => setDestino('admin_parcial')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  destino === 'admin_parcial'
                    ? 'bg-primary/10 border-primary shadow-sm text-primary'
                    : 'bg-surface-container-low border-outline-variant/50 text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-black leading-tight">Dejar Fondo Vuelto</span>
                </div>
                <span className="text-[9px] text-on-surface-variant opacity-80 leading-snug">
                  Deja sencillo y saldo al Admin
                </span>
              </button>

              {/* Opción 3: Dejar todo al siguiente turno */}
              <button
                type="button"
                onClick={() => setDestino('dejar_todo')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  destino === 'dejar_todo'
                    ? 'bg-primary/10 border-primary shadow-sm text-primary'
                    : 'bg-surface-container-low border-outline-variant/50 text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-black leading-tight">Traspaso Completo</span>
                </div>
                <span className="text-[9px] text-on-surface-variant opacity-80 leading-snug">
                  Pasa 100% al sig. recepcionista
                </span>
              </button>

            </div>

            {/* Configuración adicional si deja fondo parcial */}
            {destino === 'admin_parcial' && (
              <div className="p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between gap-3 animate-fade-in mt-1">
                <span className="text-[10px] font-bold text-on-surface">Monto a dejar en gaveta (S/.):</span>
                <input
                  type="number"
                  min="0"
                  max={real}
                  step="1"
                  value={fondoSencillo}
                  onChange={(e) => setFondoSencillo(e.target.value)}
                  className="w-24 bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-mono font-bold text-right outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Resumen de Liquidación */}
            {montoReal !== '' && (
              <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-2xl p-3 flex justify-around text-center text-xs mt-1">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Entregado a Admin</span>
                  <span className="font-mono font-black text-sm text-primary">S/. {montoEntregadoAdmin.toFixed(2)}</span>
                </div>
                <div className="w-[1px] bg-outline-variant/60 my-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant block">Queda en Gaveta</span>
                  <span className={`font-mono font-black text-sm ${montoDejadoCaja === 0 ? 'text-on-surface-variant' : 'text-emerald-600'}`}>
                    S/. {montoDejadoCaja.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Observaciones / Comentarios
            </label>
            <textarea
              placeholder="Detalles de la entrega al administrador o incidencias del turno..."
              rows={2}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none font-medium"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/50">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-xs text-on-surface-variant cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || montoReal === ''}
              className="bg-primary text-on-primary font-black text-xs px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando Cierre...</span>
                </>
              ) : (
                <>
                  <span>Cerrar Turno y Liquidar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
