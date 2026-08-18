import React, { useState, useRef } from 'react';
import { X, Receipt, Upload, Trash2, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../data/adapters/api.adapter';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';

interface ModalRegistrarGastoAdminProps {
  isOpen: boolean;
  onClose: () => void;
  onGastoRegistrado: () => void;
}

export const ModalRegistrarGastoAdmin: React.FC<ModalRegistrarGastoAdminProps> = ({
  isOpen,
  onClose,
  onGastoRegistrado,
}) => {
  const [monto, setMonto] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [categoria, setCategoria] = useState<'personal' | 'servicios' | 'mantenimiento' | 'otros'>('personal');
  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [observaciones, setObservaciones] = useState<string>('');
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorLocal('El comprobante no debe superar los 5MB.');
        return;
      }
      setArchivoComprobante(file);
      if (file.type.startsWith('image/')) {
        setPreviewComprobante(URL.createObjectURL(file));
      } else {
        setPreviewComprobante(null);
      }
    }
  };

  const handleRemoverComprobante = () => {
    setArchivoComprobante(null);
    setPreviewComprobante(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorLocal('Ingrese un monto válido mayor a S/. 0.00');
      return;
    }

    if (!concepto.trim()) {
      setErrorLocal('El concepto o descripción del gasto es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('monto', montoNum.toString());
      formData.append('concepto', concepto.trim());
      formData.append('categoria', categoria);
      formData.append('fecha', new Date(fecha).toISOString());
      if (observaciones.trim()) {
        formData.append('observaciones', observaciones.trim());
      }
      if (archivoComprobante) {
        formData.append('comprobante', archivoComprobante);
      }

      await api.post('/bitacora/gastos-administrativos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      AlertAdapter.toast('Gasto administrativo registrado con éxito', 'success');
      onGastoRegistrado();
      onClose();
    } catch (err: any) {
      console.error('Error al registrar gasto:', err);
      setErrorLocal(err?.response?.data?.message || 'No se pudo registrar el gasto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-on-surface flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 bg-primary/10 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-primary font-bold">
            <Receipt className="h-5 w-5" />
            <h3 className="text-lg">Registrar Gasto Administrativo / Fin de Mes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorLocal && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* CATEGORÍA DE GASTO */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Categoría del Gasto *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'personal', label: '👷 Pago de Personal', desc: 'Planilla, limpieza, recepcionistas' },
                { key: 'servicios', label: '💡 Servicios Básicos', desc: 'Luz, Agua, Internet, Cable' },
                { key: 'mantenimiento', label: '🔧 Mantenimiento', desc: 'Pintura, plomería, A/C' },
                { key: 'otros', label: '📦 Otros Gastos', desc: 'Impuestos, compras mayores' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategoria(cat.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    categoria === cat.key
                      ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <p className="text-xs">{cat.label}</p>
                  <p className="text-[10px] text-on-surface-variant/70 font-normal leading-tight mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* CONCEPTO */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Descripción o Concepto *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
              <input
                type="text"
                required
                placeholder="Ej. Pago sueldo Recepcionista Juan (Agosto), Recibo Luz Enosa..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full pl-9 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* MONTO Y FECHA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Monto del Pago (S/.) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-primary select-none">
                  S/.
                </span>
                <input
                  type="number"
                  required
                  min="0.10"
                  step="0.10"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full pl-10 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm font-black text-primary focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Fecha de Pago *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full pl-9 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Pagado por transferencia BCP, queda saldo pendiente de S/. 50..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* COMPROBANTE / RECIBO ADJUNTO */}
          <div className="pt-2 border-t border-outline-variant/60">
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 flex items-center justify-between">
              <span>Recibo, Factura o Comprobante (Opcional)</span>
              <span className="text-[10px] font-normal text-on-surface-variant">JPG, PNG o PDF (Máx 5MB)</span>
            </label>

            {!archivoComprobante ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant hover:border-primary/60 hover:bg-primary/5 rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
              >
                <Upload className="h-4 w-4 text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface">Adjuntar foto o escaneo de recibo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-3 bg-surface-container-low border border-primary/30 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {previewComprobante ? (
                    <img
                      src={previewComprobante}
                      alt="Recibo"
                      className="h-10 w-10 object-cover rounded-lg border border-outline-variant shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      DOC
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-on-surface truncate">{archivoComprobante.name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {(archivoComprobante.size / 1024).toFixed(1)} KB — Listo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoverComprobante}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-opacity-90 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                'Guardar Gasto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
