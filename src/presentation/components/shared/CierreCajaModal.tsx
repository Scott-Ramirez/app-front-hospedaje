import React, { useState } from 'react';
import { useCajaSesion } from '../../context/CajaSesionContext';
import { X, Wallet, Info, Loader2, ArrowRight } from 'lucide-react';

interface CierreCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CierreCajaModal: React.FC<CierreCajaModalProps> = ({ isOpen, onClose }) => {
  const { cajaActiva, cerrarCaja } = useCajaSesion();
  const [montoReal, setMontoReal] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoReal === '') return;

    setSubmitting(true);
    const success = await cerrarCaja(real, observaciones);
    if (!success) {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/70 backdrop-blur-md select-none">
      
      {/* Caja del Modal */}
      <div className="bg-surface text-on-surface w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-outline-variant/60 flex flex-col gap-5 relative animate-fade-in">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-on-surface">Cierre de Caja y Arqueo</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Turno iniciado: {new Date(cajaActiva.fecha_apertura).toLocaleDateString()} a las {new Date(cajaActiva.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
          <div className="bg-surface-container-low border border-outline-variant/40 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block leading-none">Inicial</span>
            <p className="font-mono text-xs font-extrabold text-on-surface">S/. {inicial.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider block leading-none">Efectivo (+)</span>
            <p className="font-mono text-xs font-extrabold text-emerald-600">S/. {ingresosEfectivo.toFixed(2)}</p>
          </div>
          <div className="bg-error/5 border border-error/10 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-error uppercase font-bold tracking-wider block leading-none">Egresos (-)</span>
            <p className="font-mono text-xs font-extrabold text-error">S/. {egresos.toFixed(2)}</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl text-center space-y-1">
            <span className="text-[9px] text-blue-600 uppercase font-bold tracking-wider block leading-none">Yape/Plin (★)</span>
            <p className="font-mono text-xs font-extrabold text-blue-600">S/. {ingresosDigital.toFixed(2)}</p>
          </div>
        </div>

        {/* Saldo Esperado Neto */}
        <div className="bg-surface-container border border-outline-variant/60 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5 text-left">
            <h4 className="text-xs font-black text-on-surface">Saldo Físico Esperado en Gaveta</h4>
            <p className="text-[10px] text-on-surface-variant font-medium leading-none">Monto en efectivo a entregar (Fondo + Efectivo - Egresos).</p>
          </div>
          <span className="font-mono text-xl font-black text-primary">S/. {esperadoFisico.toFixed(2)}</span>
        </div>

        {/* Formulario de Declaración */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Efectivo Físico Real En Caja (S/.)
            </label>
            <input
              type="number"
              required
              min="0.00"
              step="0.01"
              placeholder="0.00"
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-lg font-black font-mono outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
            />
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Cuente físicamente los billetes y monedas que entregará al siguiente turno.
            </span>
          </div>

          {/* Estado de Descuadre Dinámico */}
          {montoReal !== '' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
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
                    ? '¡Caja perfectamente cuadrada!'
                    : descuadre < 0
                    ? `Faltante detectado (Dinero que falta en caja)`
                    : `Sobrante detectado (Dinero excedente)`}
                </span>
              </div>
              <span className="font-mono text-sm font-black">
                {descuadre >= 0 ? '+' : ''}S/. {descuadre.toFixed(2)}
              </span>
            </div>
          )}

          {/* Observaciones */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Comentarios u Observaciones
            </label>
            <textarea
              placeholder="Mencione el estado del turno o motivos de descuadre si los hubiera..."
              rows={2}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none font-medium"
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
                  <span>Procesando Arqueo...</span>
                </>
              ) : (
                <>
                  <span>Cerrar Turno e Iniciar Logout</span>
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
