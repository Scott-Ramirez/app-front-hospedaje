import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, User, Phone, IdCard, X, AlertCircle, Clock, Receipt, Upload, Image as ImageIcon, Trash2, ShieldAlert } from 'lucide-react';
import type { ReservaDTO } from '../../../data/repositories/reservas.repository';
import { ReservasRepository } from '../../../data/repositories/reservas.repository';

interface CrearReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReservaDTO) => Promise<void>;
  habitaciones: any[];
  habitacionInicial?: any | null;
}

const reservasRepo = new ReservasRepository();

export const CrearReservaModal: React.FC<CrearReservaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  habitaciones = [],
  habitacionInicial,
}) => {
  const listaHabitaciones = useMemo(() => {
    const arr = Array.isArray(habitaciones) ? [...habitaciones] : [];
    return arr.sort((a, b) => {
      const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10);
      const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [habitaciones]);

  const [habitacionId, setHabitacionId] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [dni, setDni] = useState<string>('');
  const [celular, setCelular] = useState<string>('');
  const [todasReservas, setTodasReservas] = useState<ReservaDTO[]>([]);
  
  // Fechas por defecto: hoy a las 14:00 hasta mañana a las 12:00
  const formatDateForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const inicio = new Date();
    inicio.setHours(14, 0, 0, 0);
    return formatDateForInput(inicio);
  });

  const [fechaFin, setFechaFin] = useState<string>(() => {
    const fin = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fin.setHours(12, 0, 0, 0);
    return formatDateForInput(fin);
  });

  const [precioNocheManual, setPrecioNocheManual] = useState<string>('');
  const [montoAdelanto, setMontoAdelanto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta'>('yape');
  const [observaciones, setObservaciones] = useState<string>('');
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar reservas para validar cruces de fechas
  useEffect(() => {
    if (isOpen) {
      reservasRepo.listarTodas().then((data) => {
        setTodasReservas(data || []);
      }).catch((err) => console.error('Error al cargar reservas:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (habitacionInicial?.id) {
      setHabitacionId(habitacionInicial.id);
      setPrecioNocheManual(String(habitacionInicial.precio || ''));
    } else if (listaHabitaciones.length > 0) {
      setHabitacionId(listaHabitaciones[0].id);
      setPrecioNocheManual(String(listaHabitaciones[0].precio || ''));
    }
  }, [habitacionInicial, habitaciones, isOpen]);

  // Limpiar estado al cerrar/abrir
  useEffect(() => {
    if (isOpen) {
      setErrorLocal(null);
      setArchivoComprobante(null);
      setPreviewComprobante(null);
    }
  }, [isOpen]);

  // Actualizar precio cuando cambia la habitación seleccionada
  const habSeleccionada = listaHabitaciones.find((h) => h.id === habitacionId);
  useEffect(() => {
    if (habSeleccionada) {
      setPrecioNocheManual(String(habSeleccionada.precio || ''));
    }
  }, [habitacionId, habSeleccionada]);

  // Cálculo de días / noches entre fecha inicio y fin
  const { diasEstadia, fechaInvalida } = useMemo(() => {
    if (!fechaInicio || !fechaFin) return { diasEstadia: 1, fechaInvalida: false };
    const d1 = new Date(fechaInicio);
    const d2 = new Date(fechaFin);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { diasEstadia: 1, fechaInvalida: false };
    }
    const diffMs = d2.getTime() - d1.getTime();
    if (diffMs <= 0) {
      return { diasEstadia: 0, fechaInvalida: true };
    }
    const diffHoras = diffMs / (1000 * 60 * 60);
    const dias = Math.max(1, Math.ceil(diffHoras / 24));
    return { diasEstadia: dias, fechaInvalida: false };
  }, [fechaInicio, fechaFin]);

  // Detección de cruce de fechas con reservas confirmadas existentes
  const conflictoReserva = useMemo(() => {
    if (!habitacionId || !fechaInicio || !fechaFin || todasReservas.length === 0) return null;
    const inicioD = new Date(fechaInicio);
    const finD = new Date(fechaFin);
    if (isNaN(inicioD.getTime()) || isNaN(finD.getTime()) || finD <= inicioD) return null;

    // Buscar reservas confirmadas para esta habitación (por ID o por número físico)
    const conflicto = todasReservas.find((r: ReservaDTO) => {
      if (r.estado !== 'confirmada') return false;
      const matchId = r.habitacionId === habitacionId;
      const matchNumero = habSeleccionada?.numero && r.habitacion?.numero === habSeleccionada.numero;
      if (!matchId && !matchNumero) return false;

      const rInicio = new Date(r.fecha_inicio);
      const rFin = new Date(r.fecha_fin);
      if (isNaN(rInicio.getTime()) || isNaN(rFin.getTime())) return false;

      // Hay cruce si (rInicio < finD) && (rFin > inicioD)
      return rInicio < finD && rFin > inicioD;
    });

    if (!conflicto) return null;

    const inicioConflicto = new Date(conflicto.fecha_inicio);
    const finConflicto = new Date(conflicto.fecha_fin);

    return {
      reserva: conflicto,
      huespedNombre: conflicto.huesped?.nombre || conflicto.nombre || 'Cliente',
      fechaInicioFmt: inicioConflicto.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      fechaFinFmt: finConflicto.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rango: `${inicioConflicto.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} al ${finConflicto.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    };
  }, [habitacionId, habSeleccionada, fechaInicio, fechaFin, todasReservas]);

  const precioPorNoche = parseFloat(precioNocheManual) || Number(habSeleccionada?.precio || 0) || 0;
  const montoTotalEstimado = Math.max(0, precioPorNoche * diasEstadia) || 0;
  const adelantoNum = parseFloat(montoAdelanto) || 0;
  const saldoPendiente = Math.max(0, montoTotalEstimado - adelantoNum) || 0;

  const esMetodoDigital = metodoPago !== 'efectivo';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorLocal('La captura o comprobante no debe superar los 5MB.');
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

  // Cerrar con tecla Escape (debe declararse antes de cualquier return condicional)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (fechaInvalida || diasEstadia <= 0) {
      setErrorLocal('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (conflictoReserva) {
      setErrorLocal(
        `Conflicto con Reserva Existente: La habitación ya está reservada para "${conflictoReserva.huespedNombre}" (${conflictoReserva.rango}). Seleccione otro rango de fechas o habitación.`
      );
      return;
    }

    const dniLimpio = dni.trim().replace(/\D/g, '');
    if (dniLimpio.length !== 8) {
      setErrorLocal('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    const celLimpio = celular.trim().replace(/\D/g, '');
    if (celLimpio && celLimpio.length !== 9) {
      setErrorLocal('El teléfono/celular debe contener exactamente 9 dígitos numéricos.');
      return;
    }

    const adelanto = parseFloat(montoAdelanto);
    if (isNaN(adelanto) || adelanto <= 0) {
      setErrorLocal('El abono / pago por adelantado es obligatorio y debe ser mayor a S/. 0.00 para confirmar la reserva.');
      return;
    }

    if (adelanto > montoTotalEstimado && montoTotalEstimado > 0) {
      setErrorLocal(`El abono (S/. ${adelanto.toFixed(2)}) no puede ser mayor al monto total de la reserva (S/. ${montoTotalEstimado.toFixed(2)}).`);
      return;
    }

    if (!habitacionId) {
      setErrorLocal('Seleccione una habitación para la reserva.');
      return;
    }

    setEnviando(true);
    try {
      let comprobanteUrlSubida: string | undefined = undefined;

      // Si adjuntó archivo de comprobante, subirlo primero
      if (archivoComprobante) {
        const formData = new FormData();
        formData.append('comprobante', archivoComprobante);
        const resUpload = await reservasRepo.subirComprobante(formData);
        comprobanteUrlSubida = resUpload.comprobante_url;
      }

      await onSubmit({
        habitacionId,
        nombre: nombre.trim(),
        dni: dni.trim(),
        celular: celular.trim(),
        fecha_inicio: new Date(fechaInicio).toISOString(),
        fecha_fin: new Date(fechaFin).toISOString(),
        monto_adelanto: adelanto,
        metodo_pago: metodoPago,
        monto_total_estimado: montoTotalEstimado,
        comprobante_url: comprobanteUrlSubida,
        observaciones: observaciones.trim(),
      });
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al guardar la reserva.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-outline-variant rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-on-surface max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-primary/10 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg">Registrar Nueva Reserva</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorLocal && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* HABITACIÓN */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Habitación Seleccionada
            </label>
            <select
              value={habitacionId}
              onChange={(e) => setHabitacionId(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface font-medium cursor-pointer"
            >
              <option value="">Seleccione una habitación...</option>
              {listaHabitaciones.map((h) => {
                const tipoLegible = h.tipo === 'simple' ? 'Habitación Simple' : 'Habitación Doble';
                const extras = [];
                if (h.dos_camas) extras.push('2 Camas');
                if (h.aire_acondicionado) extras.push('Aire');
                if (h.ventilador) extras.push('Ventilador');
                const extrasText = extras.length > 0 ? ` (${extras.join(' / ')})` : '';

                // Próxima reserva para esta habitación
                const resHab = todasReservas.find((r) => {
                  if (r.estado !== 'confirmada') return false;
                  const matchId = r.habitacionId === h.id;
                  const matchNumero = h.numero && r.habitacion?.numero === h.numero;
                  return (matchId || matchNumero) && new Date(r.fecha_fin) >= new Date();
                });
                let badge = '';
                if (resHab) {
                  const fIni = new Date(resHab.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
                  const fFin = new Date(resHab.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
                  badge = ` [📅 Ocupada: ${fIni} - ${fFin}]`;
                }

                return (
                  <option key={h.id} value={h.id}>
                    Habitación {h.numero} — {tipoLegible}{extrasText} — S/. {Number(h.precio || 0).toFixed(2)}/día{badge}
                  </option>
                );
              })}
            </select>
          </div>

          {/* DATOS DEL HUÉSPED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  DNI / Documento *
                </label>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {dni.length}/8
                </span>
              </div>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  placeholder="Ej. 73849201"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full pl-9 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Teléfono / Celular
                </label>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {celular.length}/9
                </span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="Ej. 987654321"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="w-full pl-9 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Nombre Completo del Huésped *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
              <input
                type="text"
                required
                placeholder="Nombre del cliente reservante"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-9 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* RANGO DE FECHAS */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Fecha / Hora Inicio *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={`w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none ${
                    conflictoReserva
                      ? 'border-red-500 bg-red-500/5 focus:ring-red-500 text-red-700 dark:text-red-300'
                      : 'border-outline-variant focus:ring-primary text-on-surface'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Fecha / Hora Fin (Check-out) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={`w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none ${
                    conflictoReserva
                      ? 'border-red-500 bg-red-500/5 focus:ring-red-500 text-red-700 dark:text-red-300'
                      : 'border-outline-variant focus:ring-primary text-on-surface'
                  }`}
                />
              </div>
            </div>

            {/* ALERTA DE CRUCE DE RESERVAS */}
            {conflictoReserva && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs space-y-1.5 animate-fade-in text-on-surface">
                <div className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>¡Cruce de Fechas Detectado con Otra Reserva!</span>
                </div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  La <strong>Habitación {habSeleccionada?.numero}</strong> ya cuenta con una reserva confirmada a nombre de <strong>"{conflictoReserva.huespedNombre}"</strong> para el período del <strong>{conflictoReserva.rango}</strong>.
                </p>
                <p className="text-red-600 dark:text-red-400 font-semibold text-[11px]">
                  ⛔ Por favor modifique las fechas (salida antes del {conflictoReserva.fechaInicioFmt}) o elija otra habitación para evitar sobreventa.
                </p>
              </div>
            )}

            {/* BADGE DE DURACIÓN Y CÁLCULO DE DÍAS */}
            {!conflictoReserva && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                fechaInvalida 
                  ? 'bg-error/10 border-error/30 text-error' 
                  : 'bg-primary/5 border-primary/20 text-on-surface'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {fechaInvalida ? (
                      <strong className="text-error">La fecha de fin debe ser posterior a la de inicio</strong>
                    ) : (
                      <>
                        Duración estimada: <strong className="text-primary font-black text-sm">{diasEstadia} {diasEstadia === 1 ? 'día / noche' : 'días / noches'}</strong>
                      </>
                    )}
                  </span>
                </div>
                
                {!fechaInvalida && (
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <span>Tarifa:</span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={precioNocheManual}
                      onChange={(e) => setPrecioNocheManual(e.target.value)}
                      className="w-20 bg-surface border border-outline-variant rounded px-2 py-0.5 text-xs text-right font-bold text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      title="Precio por día/noche"
                    />
                    <span>S/./día</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RESUMEN FINANCIERO Y ABONO */}
          <div className="p-4 bg-surface-container-lowest border border-primary/30 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-4 w-4" /> Resumen de Montos y Abono
              </span>
              <div className="text-right">
                <span className="text-xs text-on-surface-variant">Monto Total de la Reserva:</span>
                <p className="text-lg font-black text-primary leading-tight">
                  S/. {montoTotalEstimado.toFixed(2)}
                </p>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  ({diasEstadia} {diasEstadia === 1 ? 'día' : 'días'} × S/. {precioPorNoche.toFixed(2)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Monto de Abono / Adelanto (S/.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-green-600 select-none">
                    S/.
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    placeholder="Ej. 30.00"
                    value={montoAdelanto}
                    onChange={(e) => setMontoAdelanto(e.target.value)}
                    className="w-full pl-10 bg-surface border border-green-500/40 rounded-lg px-3 py-2 text-sm font-black text-green-700 dark:text-green-400 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Botones rápidos de sugerencia de abono */}
                {montoTotalEstimado > 0 && (
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setMontoAdelanto((montoTotalEstimado * 0.5).toFixed(2))}
                      className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-outline-variant text-[10px] font-bold text-on-surface-variant transition-colors cursor-pointer"
                    >
                      50% (S/. {(montoTotalEstimado * 0.5).toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMontoAdelanto(montoTotalEstimado.toFixed(2))}
                      className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-outline-variant text-[10px] font-bold text-on-surface-variant transition-colors cursor-pointer"
                    >
                      100% Total
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Método de Pago del Abono *
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none capitalize cursor-pointer"
                >
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                </select>

                {/* Saldo pendiente */}
                <div className="mt-2 text-xs flex items-center justify-between px-2 py-1 bg-surface-container-low rounded border border-outline-variant/50">
                  <span className="text-on-surface-variant font-medium">Saldo al Check-In:</span>
                  <span className={`font-black ${saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    S/. {saldoPendiente.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN ADJUNTAR CAPTURA / COMPROBANTE DE PAGO (DIGITAL) */}
            {esMetodoDigital && (
              <div className="pt-2 border-t border-outline-variant/40">
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-primary">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Captura / Comprobante de Pago Digital (Opcional)
                  </span>
                  <span className="text-[10px] font-normal text-on-surface-variant">JPG, PNG o PDF (Máx 5MB)</span>
                </label>

                {!archivoComprobante ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant hover:border-primary/60 hover:bg-primary/5 rounded-xl p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="h-5 w-5 text-on-surface-variant" />
                    <span className="text-xs font-semibold text-on-surface">
                      Subir captura de {metodoPago.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Haga clic o toque para seleccionar la foto del comprobante
                    </span>
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
                          alt="Comprobante"
                          className="h-12 w-12 object-cover rounded-lg border border-outline-variant shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          DOC
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-on-surface truncate">{archivoComprobante.name}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {(archivoComprobante.size / 1024).toFixed(1)} KB — Listo para guardar
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoverComprobante}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Quitar comprobante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Llegará a las 3 PM, solicita cama adicional"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* FOOTER BOTONES */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || fechaInvalida || Boolean(conflictoReserva)}
              className={`px-5 py-2.5 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 ${
                conflictoReserva || fechaInvalida
                  ? 'bg-outline-variant text-on-surface-variant opacity-60 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-opacity-90 cursor-pointer'
              }`}
            >
              {enviando ? 'Guardando Reserva...' : 'Confirmar y Registrar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
