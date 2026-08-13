import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { solicitudEgresoRepository } from '../../../data/repositories/solicitudEgreso.repository';
import type { SolicitudEgreso } from '../../../data/repositories/solicitudEgreso.repository';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { SolesIcon } from '../shared/SolesIcon';

interface Props {
  solicitud: SolicitudEgreso;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjuntarBoletaModal: React.FC<Props> = ({ solicitud, onClose, onSuccess }) => {
  const [montoReal, setMontoReal] = useState(solicitud.monto.toFixed(2));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoReal);
    if (isNaN(monto) || monto <= 0) {
      AlertAdapter.error('Monto inválido', 'Ingresa el monto real gastado.');
      return;
    }
    if (!archivo) {
      AlertAdapter.error('Boleta requerida', 'Debes adjuntar la foto o imagen de la boleta.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('montoReal', monto.toString());
      formData.append('boleta', archivo);
      await solicitudEgresoRepository.adjuntarBoleta(solicitud.id, formData);
      setSuccess(true);
      onSuccess();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      AlertAdapter.error('Error', err?.response?.data?.message || 'No se pudo adjuntar la boleta.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Camera className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-black text-sm text-on-surface">Adjuntar Boleta de Compra</h2>
              <p className="text-[10px] text-on-surface-variant font-medium">Paso 2 de 2 · Confirmar gasto real</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors">
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-black text-on-surface text-sm">¡Boleta enviada!</p>
                <p className="text-xs text-on-surface-variant mt-1">El administrador revisará y liquidará el gasto.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Referencia de la solicitud */}
              <div className="bg-surface-container rounded-xl p-3.5 border border-outline-variant/50">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Solicitud pre-aprobada</p>
                <p className="text-sm font-bold text-on-surface">{solicitud.concepto}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Monto estimado: <span className="font-bold font-mono">S/. {Number(solicitud.monto).toFixed(2)}</span>
                </p>
              </div>

              {/* Monto real */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <SolesIcon className="h-3 w-3" /> Monto Real Gastado (S/.)
                </label>
                <input
                  type="number" required min="0.01" step="0.01"
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={montoReal}
                  onChange={(e) => setMontoReal(e.target.value)}
                />
                <p className="text-[10px] text-on-surface-variant/60">
                  {parseFloat(montoReal) !== solicitud.monto && parseFloat(montoReal) > 0
                    ? `Diferencia con estimado: S/. ${(parseFloat(montoReal) - solicitud.monto).toFixed(2)}`
                    : 'Igual al monto estimado'}
                </p>
              </div>

              {/* Upload de boleta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Foto de Boleta / Factura <span className="text-error font-black">*</span>
                  <span className="font-normal opacity-50 ml-1">(JPG, PNG, PDF — máx. 5MB)</span>
                </label>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleFile} />

                {preview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-outline-variant/60 cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <img src={preview} alt="preview boleta" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold">Cambiar imagen</p>
                    </div>
                  </div>
                ) : archivo ? (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{archivo.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{(archivo.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-500/5 transition-all cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-emerald-600" />
                    <p className="text-xs font-bold text-on-surface-variant">Adjuntar Boleta <span className="text-error">*</span></p>
                    <p className="text-[10px] text-on-surface-variant/60">Haz clic para seleccionar</p>
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white font-black text-xs py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando boleta...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Enviar para Liquidación</>
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
