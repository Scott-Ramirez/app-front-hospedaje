import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, CreditCard, Phone, Coins, Wallet, Loader2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { useHabitaciones } from '../../hooks/useHabitaciones';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { huespedesRepository } from '../../../data/repositories/huespedes.repository';
import { ReservasRepository } from '../../../data/repositories/reservas.repository';
import type { RegistroInicialDto } from '../../../data/repositories/estancias.repository';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (datos: RegistroInicialDto) => Promise<boolean>;
}

const reservasRepo = new ReservasRepository();

export const CheckInModal = ({ isOpen, onClose, onConfirm }: CheckInModalProps) => {
    const { habitaciones, cargando: loadingHabitaciones } = useHabitaciones() as any;
    const [submitting, setSubmitting] = useState(false);
    const [noches, setNoches] = useState('1');
    const [reservasConfirmadas, setReservasConfirmadas] = useState<any[]>([]);

    // Autocomplete
    const [buscandoHuesped, setBuscandoHuesped] = useState(false);
    const [coincidencias, setCoincidencias] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        nombre: '',
        dni: '',
        celular: '',
        habitacionId: '',
        total_pagar: '',
        pago_inicial: '',
        metodo_pago: '',
    });

    // Cargar reservas confirmadas al abrir modal
    useEffect(() => {
        if (isOpen) {
            reservasRepo.listarTodas().then(data => {
                const confirmadas = data.filter((r: any) => r.estado === 'confirmada');
                setReservasConfirmadas(confirmadas);
            }).catch(err => console.error('Error al cargar reservas en CheckInModal:', err));
        }
    }, [isOpen]);

    // Limpiar el formulario cada vez que se abre/cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                nombre: '',
                dni: '',
                celular: '',
                habitacionId: '',
                total_pagar: '',
                pago_inicial: '',
                metodo_pago: '',
            });
            setNoches('1');
            setCoincidencias([]);
        }
    }, [isOpen]);

    // Filtrar solo las habitaciones que tengan estado disponible (según la API)
    const habitacionesDisponibles = Array.isArray(habitaciones)
        ? habitaciones.filter((h: any) => h.estado === 'disponible')
        : [];

    // Calcular si la habitación seleccionada tiene una reserva próxima (por ID o por número físico de habitación)
    const infoReserva = useMemo(() => {
        if (!formData.habitacionId || reservasConfirmadas.length === 0) return null;
        const habSeleccionada = habitacionesDisponibles.find((h: any) => h.id === formData.habitacionId);
        const ahora = new Date();
        
        // Reservas confirmadas para esta habitación (por ID o por mismo número de habitación)
        const futuras = reservasConfirmadas
            .filter((r: any) => {
                const matchId = r.habitacionId === formData.habitacionId;
                const matchNumero = habSeleccionada?.numero && r.habitacion?.numero === habSeleccionada.numero;
                return matchId || matchNumero;
            })
            .filter((r: any) => new Date(r.fecha_fin).getTime() >= ahora.getTime())
            .sort((a: any, b: any) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

        const res = futuras[0];
        if (!res) return null;

        const inicioRes = new Date(res.fecha_inicio);
        const diffMs = inicioRes.getTime() - ahora.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);
        const diasHastaReserva = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        
        // Es para hoy si inicia en menos de 14 horas o la fecha ya pasó
        const esHoy = diffHoras <= 14;
        const numNoches = Number(noches) || 1;
        const hayConflicto = esHoy || (numNoches > diasHastaReserva);

        return {
            reserva: res,
            esHoy,
            diasHastaReserva,
            hayConflicto,
            fechaInicioStr: inicioRes.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            nombreCliente: res.huesped?.nombre || res.nombre || 'Cliente',
            abono: Number(res.monto_adelanto) || 0,
        };
    }, [formData.habitacionId, reservasConfirmadas, habitacionesDisponibles, noches]);

    // Autocalcular el Total a Cobrar en base a la habitación y noches seleccionadas
    useEffect(() => {
        if (formData.habitacionId && noches) {
            const habSelected = habitacionesDisponibles.find((h: any) => h.id === formData.habitacionId);
            if (habSelected) {
                const precioBase = Number(habSelected.precio) || 0;
                const totalCalculado = precioBase * (Number(noches) || 1);
                setFormData(prev => ({
                    ...prev,
                    total_pagar: totalCalculado.toString()
                }));
            }
        }
    }, [formData.habitacionId, noches]);

    // Buscar huéspedes en tiempo real por DNI
    useEffect(() => {
        const queryDni = formData.dni.trim();
        if (queryDni.length < 3) {
            setCoincidencias([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            try {
                setBuscandoHuesped(true);
                const data = await huespedesRepository.buscar(queryDni);
                const list = (data && !Array.isArray(data) && Array.isArray((data as any).data))
                    ? (data as any).data
                    : (Array.isArray(data) ? data : []);
                
                // Mostrar sugerencias que coincidan
                setCoincidencias(list);
            } catch (err) {
                console.error('Error al autocompletar huésped:', err);
            } finally {
                setBuscandoHuesped(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [formData.dni]);

    if (!isOpen) return null;

    const handleSeleccionarCoincidencia = (huesped: any) => {
        setFormData(prev => ({
            ...prev,
            nombre: huesped.nombre,
            dni: huesped.dni,
            celular: huesped.celular || '',
        }));
        setCoincidencias([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar conflicto de reserva
        if (infoReserva?.esHoy) {
            AlertAdapter.error(
                'Habitación con Reserva para Hoy',
                `Esta habitación está reservada para hoy a nombre de "${infoReserva.nombreCliente}". Para registrar su ingreso, utilice el botón "Procesar Check-In" en el módulo de Reservas.`
            );
            return;
        }

        if (infoReserva && infoReserva.hayConflicto) {
            AlertAdapter.error(
                'Cruce de Fechas con Reserva',
                `No puede registrar ${noches} noches porque cruzaría con la reserva confirmada del ${infoReserva.fechaInicioStr}. El máximo disponible para esta habitación es de ${infoReserva.diasHastaReserva} noche(s).`
            );
            return;
        }

        setSubmitting(true);

        // --- VALIDACIONES DE DÍGITOS ---
        const dniLimpio = formData.dni.replace(/\D/g, '');
        const celularLimpio = formData.celular.replace(/\D/g, '');

        if (dniLimpio.length !== 8) {
            AlertAdapter.error('Error de Validación', 'El DNI debe tener exactamente 8 dígitos numéricos.');
            setSubmitting(false);
            return;
        }

        if (formData.celular && celularLimpio.length !== 9) {
            AlertAdapter.error('Error de Validación', 'El número de celular debe tener exactamente 9 dígitos numéricos.');
            setSubmitting(false);
            return;
        }

        const pagoInicialNum = formData.pago_inicial ? Number(formData.pago_inicial) : 0;
        const totalPagarNum = Number(formData.total_pagar);

        if (pagoInicialNum > 0) {
            if (!formData.metodo_pago) {
                AlertAdapter.error('Falta Información', 'El método de pago es obligatorio cuando se especifica un pago inicial.');
                setSubmitting(false);
                return;
            }
            if (pagoInicialNum > totalPagarNum) {
                AlertAdapter.error('Monto Inválido', 'El pago inicial no puede superar el total a cobrar.');
                setSubmitting(false);
                return;
            }
        }

        // Calcular la fecha de salida a partir de la cantidad de noches (setea a las 13:00 / 1:00 PM del día destino)
        const totalNoches = Number(noches) || 1;
        const fechaSalida = new Date();
        fechaSalida.setDate(fechaSalida.getDate() + totalNoches);
        fechaSalida.setHours(13, 0, 0, 0);

        const payload: RegistroInicialDto = {
            nombre: formData.nombre.trim(),
            dni: dniLimpio,
            celular: celularLimpio ? celularLimpio : undefined,
            habitacionId: formData.habitacionId,
            total_pagar: totalPagarNum,
            fecha_salida_programada: fechaSalida.toISOString(),
            pago_inicial: pagoInicialNum > 0 ? pagoInicialNum : undefined,
            metodo_pago: pagoInicialNum > 0 ? formData.metodo_pago : undefined,
        };

        const exito = await onConfirm(payload);
        setSubmitting(false);
        if (exito) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in duration-200">
            <div className="bg-surface text-on-surface w-full max-w-lg rounded-xl shadow-xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabecera del Modal */}
                <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <div>
                        <h3 className="text-lg font-bold text-primary">Registrar Ingreso (Check-In)</h3>
                        <p className="text-xs text-on-surface-variant">Ingresa los datos para registrar al huésped y asignar habitación.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 relative">

                    {/* SECCIÓN 1: DATOS DEL HUÉSPED */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-1"> Datos del Huésped</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 relative">
                                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" /> Documento DNI (8 dígitos)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. 74839201"
                                        maxLength={8}
                                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        value={formData.dni}
                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '').substring(0, 8) })}
                                    />
                                    {buscandoHuesped && (
                                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                                    )}
                                </div>

                                {/* Desplegable de Coincidencias */}
                                {coincidencias.length > 0 && (
                                    <div className="absolute top-[100%] left-0 w-[200%] max-w-[400px] z-50 bg-surface-lowest border border-outline-variant shadow-lg rounded-lg mt-1 max-h-48 overflow-y-auto divide-y divide-outline-variant/60">
                                        <div className="bg-surface-container-low px-3 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                                            Coincidencias encontradas:
                                        </div>
                                        {coincidencias.map((h: any) => (
                                            <div
                                                key={h.id}
                                                onClick={() => handleSeleccionarCoincidencia(h)}
                                                className="px-3 py-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer flex justify-between"
                                            >
                                                <span>{h.nombre}</span>
                                                <span className="text-on-surface-variant/80 font-bold text-[10px]">DNI: {h.dni}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> Celular (9 dígitos)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. 912345678"
                                    maxLength={9}
                                    className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    value={formData.celular}
                                    onChange={(e) => setFormData({ ...formData, celular: e.target.value.replace(/\D/g, '').substring(0, 9) })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                <User className="h-3 w-3" /> Nombre Completo
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Nombres y apellidos del cliente"
                                className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: ALOJAMIENTO */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant pb-1">Detalles de la Habitación y Pago</h4>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-on-surface-variant">Asignar Habitación Disponible</label>
                            <select
                                required
                                className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                                value={formData.habitacionId}
                                onChange={(e) => setFormData({ ...formData, habitacionId: e.target.value })}
                            >
                                <option value="" className="bg-surface text-on-surface">{loadingHabitaciones ? 'Cargando habitaciones...' : 'Seleccione una habitación...'}</option>
                                {habitacionesDisponibles.map((hab: any) => {
                                    const tipoLegible = hab.tipo === 'simple' ? 'Habitación Simple' : (hab.tipo === 'matrimonial' || hab.tipo === 'doble' ? 'Habitación Doble' : hab.tipo);
                                    const extras = [];
                                    if (hab.dos_camas) extras.push('2 Camas');
                                    else if (hab.tipo === 'matrimonial' || hab.tipo === 'doble') extras.push('1 Cama');
                                    if (hab.aire_acondicionado) extras.push('Aire');
                                    if (hab.ventilador) extras.push('Ventilador');
                                    const extrasText = extras.length > 0 ? ` (${extras.join('/')})` : '';

                                    // Badge de reserva próxima (por ID o por número físico de habitación)
                                    const resRoom = reservasConfirmadas.find((r: any) => {
                                        const matchId = r.habitacionId === hab.id;
                                        const matchNumero = hab.numero && r.habitacion?.numero === hab.numero;
                                        return (matchId || matchNumero) && new Date(r.fecha_fin) >= new Date();
                                    });
                                    let badgeTexto = '';
                                    if (resRoom) {
                                        const diffH = (new Date(resRoom.fecha_inicio).getTime() - Date.now()) / 3600000;
                                        if (diffH <= 14) {
                                            badgeTexto = ' ⚠️ [Reservada HOY]';
                                        } else {
                                            const fechaFmt = new Date(resRoom.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
                                            badgeTexto = ` 📅 [Reserva: ${fechaFmt}]`;
                                        }
                                    }

                                    return (
                                        <option key={hab.id} value={hab.id} className="bg-surface text-on-surface font-medium">
                                            Habitación {hab.numero} — {tipoLegible}{extrasText} — S/. {Number(hab.precio)?.toFixed(2)}{badgeTexto}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* ALERTAS DE RESERVAS Y CRUCE DE FECHAS */}
                        {infoReserva?.esHoy && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs space-y-1.5 animate-fade-in">
                                <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    <span>Habitación con Reserva Confirmada para Hoy</span>
                                </div>
                                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                    Esta habitación está reservada para hoy a nombre de <strong>"{infoReserva.nombreCliente}"</strong> (con abono de <strong>S/. {infoReserva.abono.toFixed(2)}</strong>). Para ingresar a este cliente con su anticipo, use el botón <strong>Procesar Check-In</strong> en el módulo de <strong>Reservas</strong>.
                                </p>
                            </div>
                        )}

                        {infoReserva && !infoReserva.esHoy && infoReserva.hayConflicto && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1.5 animate-fade-in">
                                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>Conflicto de Fechas con Reserva Próxima</span>
                                </div>
                                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                    La habitación tiene una reserva confirmada a partir del <strong>{infoReserva.fechaInicioStr}</strong> (en {infoReserva.diasHastaReserva} días). No puede registrar <strong>{noches} noches</strong> porque cruzaría con la reserva. <strong>Máximo disponible: {infoReserva.diasHastaReserva} noche(s).</strong>
                                </p>
                            </div>
                        )}

                        {infoReserva && !infoReserva.esHoy && !infoReserva.hayConflicto && (
                            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-xs flex items-center gap-2 animate-fade-in text-on-surface-variant">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-[11px]">
                                    Esta habitación tiene una reserva programada para el <strong>{infoReserva.fechaInicioStr}</strong> ({infoReserva.diasHastaReserva} noche(s) libres disponibles sin cruce).
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Noches de Estancia
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={infoReserva && !infoReserva.esHoy ? infoReserva.diasHastaReserva : undefined}
                                    className={`rounded-md border bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                                        infoReserva?.hayConflicto ? 'border-red-500 bg-red-500/5' : 'border-outline-variant'
                                    }`}
                                    value={noches}
                                    onChange={(e) => setNoches(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface-variant">Total a Cobrar (Soles)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    value={formData.total_pagar}
                                    onChange={(e) => setFormData({ ...formData, total_pagar: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* PAGO INICIAL Y METODO DE PAGO */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <Coins className="h-3.5 w-3.5 text-primary" /> Pago Inicial (S/.)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    value={formData.pago_inicial}
                                    onChange={(e) => setFormData({ ...formData, pago_inicial: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <Wallet className="h-3 w-3" /> Método de Pago
                                </label>
                                <select
                                    required={formData.pago_inicial ? Number(formData.pago_inicial) > 0 : false}
                                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                                    disabled={!formData.pago_inicial || Number(formData.pago_inicial) <= 0}
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                >
                                    <option value="" className="bg-surface text-on-surface">Seleccione método...</option>
                                    <option value="efectivo" className="bg-surface text-on-surface">Efectivo</option>
                                    <option value="yape" className="bg-surface text-on-surface">Yape</option>
                                    <option value="plin" className="bg-surface text-on-surface">Plin</option>
                                    <option value="tarjeta" className="bg-surface text-on-surface">Tarjeta</option>
                                    <option value="transferencia" className="bg-surface text-on-surface">Transferencia</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-4 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest -mx-6 -mb-6 p-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || Boolean(infoReserva?.hayConflicto)}
                            className={`px-5 py-2 text-sm font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                                infoReserva?.hayConflicto
                                    ? 'bg-outline-variant text-on-surface-variant opacity-60 cursor-not-allowed'
                                    : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]'
                            }`}
                        >
                            {submitting ? 'Procesando...' : 'Completar Check-In'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};