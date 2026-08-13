import React, { useState, useEffect } from 'react';
import { useCajaSesion } from '../../context/CajaSesionContext';
import { useAuth } from '../../context/AuthContext';
import { cajaSesionRepository } from '../../../data/repositories/cajaSesion.repository';
import { Wallet, LogOut, Loader2, ArrowRight, Info, ArrowDown } from 'lucide-react';

export const AperturaCajaState: React.FC = () => {
  const { abrirCaja } = useCajaSesion();
  const { logout, usuario } = useAuth();
  
  const [montoInicial, setMontoInicial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ultimoCierre, setUltimoCierre] = useState<number | null>(null);
  const [loadingCierre, setLoadingCierre] = useState(true);

  // Al montar el componente, consultamos cuánto dejó el turno anterior
  useEffect(() => {
    const fetchUltimoCierre = async () => {
      try {
        const monto = await cajaSesionRepository.obtenerUltimoCierre();
        setUltimoCierre(monto);
      } catch {
        setUltimoCierre(null);
      } finally {
        setLoadingCierre(false);
      }
    };
    fetchUltimoCierre();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoInicial);

    if (isNaN(monto) || monto < 0) return;

    setSubmitting(true);
    const success = await abrirCaja(monto);
    if (!success) {
      setSubmitting(false);
    }
  };

  // Diferencia entre lo que declara el nuevo recepcionista y lo que entregó el anterior
  const montoActual = montoInicial === '' ? null : Number(montoInicial);
  const diferencia = (montoActual !== null && ultimoCierre !== null) ? montoActual - ultimoCierre : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-lg select-none">
      
      {/* Glow de fondo */}
      <div className="absolute h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="bg-surface text-on-surface w-full max-w-md p-8 rounded-3xl shadow-2xl border border-outline-variant/60 relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Icono de Caja */}
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
          <Wallet className="h-8 w-8" />
        </div>

        {/* Textos Informativos */}
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-primary">
            Apertura de Caja — Inicio de Turno
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed px-2 font-medium">
            Hola, <strong className="capitalize">{usuario?.nombre || 'Recepcionista'}</strong>. Para iniciar tu turno debes contar el efectivo en el cajón y declarar el monto que recibes.
          </p>
        </div>

        {/* AVISO DEL TURNO ANTERIOR */}
        {loadingCierre ? (
          <div className="w-full flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
          </div>
        ) : ultimoCierre !== null && ultimoCierre > 0 ? (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Fondo entregado por el turno anterior</span>
            </div>
            <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              S/. {ultimoCierre.toFixed(2)}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
              Este es el monto que dejó el recepcionista del turno anterior en el cajón. Verifica físicamente que coincida antes de declarar tu apertura.
            </p>
          </div>
        ) : (
          <div className="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Sin turno previo registrado</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
              No hay un cierre de caja anterior en el sistema. Declara el fondo base inicial asignado para este turno.
            </p>
          </div>
        )}

        {/* Flecha visual de transición */}
        {ultimoCierre !== null && ultimoCierre > 0 && (
          <div className="text-on-surface-variant/40">
            <ArrowDown className="h-5 w-5 mx-auto" />
          </div>
        )}

        {/* Formulario de declaración */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Efectivo que Recibes en Caja (S/.)
            </label>
            <input
              type="number"
              required
              min="0.00"
              step="0.01"
              placeholder="0.00"
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-lg font-black font-mono outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
            />
            <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
              Cuente físicamente los billetes y monedas antes de declarar.
            </span>
          </div>

          {/* Indicador de diferencia vs. turno anterior */}
          {diferencia !== null && ultimoCierre !== null && ultimoCierre > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
              Math.abs(diferencia) < 0.01
                ? 'bg-green-500/10 border-green-500/20 text-green-600'
                : diferencia < 0
                ? 'bg-error/10 border-error/20 text-error'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <span>
                {Math.abs(diferencia) < 0.01
                  ? 'Monto coincide con el turno anterior'
                  : diferencia < 0
                  ? `Faltante vs. turno anterior`
                  : `Sobrante vs. turno anterior`}
              </span>
              {Math.abs(diferencia) >= 0.01 && (
                <span className="font-mono font-black ml-2">
                  {diferencia > 0 ? '+' : ''}S/. {diferencia.toFixed(2)}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-xs flex items-center justify-center gap-2 text-on-surface-variant cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>

            <button
              type="submit"
              disabled={submitting || montoInicial === ''}
              className="flex-1 bg-primary text-on-primary font-black text-xs py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Abriendo caja...</span>
                </>
              ) : (
                <>
                  <span>Confirmar y Abrir Turno</span>
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
