import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, Send, Receipt, AlertCircle } from 'lucide-react';
import { solicitudEgresoRepository } from '../../../data/repositories/solicitudEgreso.repository';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export const SolicitudEgresoModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    // Preview sólo para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null); // PDF sin preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingrese un monto válido mayor a 0.');
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
      if (archivo) formData.append('boleta', archivo);

      await solicitudEgresoRepository.crear(formData);
      setSuccess(true);
      onSuccess?.();
      setTimeout(onClose, 1800);
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
              <h2 className="font-black text-sm text-on-surface">Solicitar Egreso de Caja</h2>
              <p className="text-[10px] text-on-surface-variant font-medium">Se notificará al supervisor y administrador</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors">
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Send className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-black text-on-surface text-sm">¡Solicitud enviada!</p>
              <p className="text-xs text-on-surface-variant">El supervisor y administrador fueron notificados al instante.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Aviso informativo */}
              <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-3.5 flex gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-on-surface-variant leading-relaxed">
                  No puedes retirar dinero de caja directamente. Envía esta solicitud con la boleta adjunta y un admin/supervisor la aprobará y registrará el egreso.
                </p>
              </div>

              {/* Monto */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Monto (S/.)</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  placeholder="0.00"
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* Concepto */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Concepto</label>
                <input
                  type="text" required maxLength={255}
                  placeholder="Ej: Compra de útiles de limpieza"
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Descripción adicional <span className="font-normal opacity-50">(opcional)</span></label>
                <textarea
                  rows={2} maxLength={500}
                  placeholder="Detalle adicional para el administrador..."
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {/* Upload de boleta */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Imagen de Boleta <span className="font-normal opacity-50">(JPG, PNG, PDF — máx. 5MB)</span>
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
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed border-outline-variant/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-on-surface-variant" />
                    <p className="text-xs font-bold text-on-surface-variant">Adjuntar Boleta</p>
                    <p className="text-[10px] text-on-surface-variant/60">Haz clic para seleccionar</p>
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-error font-bold bg-error/10 border border-error/20 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              {/* Actions */}
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
                    <><Send className="h-4 w-4" /> Enviar Solicitud</>
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
