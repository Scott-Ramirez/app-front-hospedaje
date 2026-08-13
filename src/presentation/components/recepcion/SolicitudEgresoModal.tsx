import React, { useState } from 'react';
import { X, Loader2, Send, Receipt, Info, FileText } from 'lucide-react';
import { solicitudEgresoRepository } from '../../../data/repositories/solicitudEgreso.repository';
import { SolesIcon } from '../shared/SolesIcon';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export const SolicitudEgresoModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingrese un monto estimado válido mayor a 0.');
      return;
    }
    if (!concepto.trim()) {
      setError('El concepto es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('monto', montoNum.toString());
      formData.append('concepto', concepto.trim());
      if (descripcion.trim()) formData.append('descripcion', descripcion.trim());

      await solicitudEgresoRepository.crear(formData);
      setSuccess(true);
      onSuccess?.();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al enviar la solicitud.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-black text-sm text-on-surface">Solicitar Permiso de Egreso</h2>
              <p className="text-[10px] text-on-surface-variant font-medium">Paso 1 de 2 · Indica qué vas a comprar</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors">
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Send className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-black text-on-surface text-sm">¡Solicitud enviada!</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  El supervisor y administrador fueron notificados.<br />
                  Cuando te pre-aprueben, podrás realizar la compra.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Indicador de flujo */}
              <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] text-on-surface-variant leading-relaxed space-y-1">
                  <p><strong className="text-on-surface">Paso 1:</strong> Indica qué necesitas comprar y el monto estimado. Se notifica al admin/supervisor.</p>
                  <p><strong className="text-on-surface">Paso 2:</strong> Una vez aprobado, realiza la compra y adjunta la boleta para su liquidación.</p>
                </div>
              </div>

              {/* Monto estimado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <SolesIcon className="h-3 w-3" /> Monto Estimado (S/.)
                </label>
                <input
                  type="number" required min="0.01" step="0.01"
                  placeholder="0.00"
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
                <p className="text-[10px] text-on-surface-variant/60">Puede variar al momento de la liquidación.</p>
              </div>

              {/* Concepto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" /> ¿Qué vas a comprar?
                </label>
                <input
                  type="text" required maxLength={255}
                  placeholder="Ej: Útiles de limpieza, jabones, papel higiénico..."
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>

              {/* Descripción adicional */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Detalle adicional <span className="font-normal opacity-50">(opcional)</span>
                </label>
                <textarea
                  rows={2} maxLength={500}
                  placeholder="Más contexto para el administrador..."
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-xs text-error font-bold bg-error/10 border border-error/20 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-on-primary font-black text-xs py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Solicitar Permiso</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
