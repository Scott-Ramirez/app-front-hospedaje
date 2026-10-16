import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCajaSesion } from '../../context/CajaSesionContext';
import { SolicitudEgresoModal } from '../recepcion/SolicitudEgresoModal';
import { SolicitudesEgresoPanel } from '../shared/SolicitudesEgresoPanel';
import { 
  DoorOpen, 
  BedDouble, 
  Sparkles, 
  Hotel, 
  CalendarDays,
  Receipt, 
  Clock, 
  Coins, 
  History, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  Users2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ReservasRepository, type ReservaDTO } from '../../../data/repositories/reservas.repository';

const DIAS_SEMANA_MINI = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface GeneralDashboardViewProps {
  data: any;
  porcentajeOcupacion: number;
}

export const GeneralDashboardView: React.FC<GeneralDashboardViewProps> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;
  const { usuario } = useAuth();
  const { cajaActiva } = useCajaSesion();
  const [isModalEgresoOpen, setIsModalEgresoOpen] = useState(false);
  const [isPanelEgresoOpen, setIsPanelEgresoOpen] = useState(false);

  // ─── MINI CALENDARIO DE RESERVAS ─────────────────────────────────────
  const [reservas, setReservas] = useState<ReservaDTO[]>([]);
  const [mesOffset, setMesOffset] = useState<number>(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(new Date());

  React.useEffect(() => {
    let montado = true;
    const repo = new ReservasRepository();
    repo.listarTodas()
      .then((datos) => {
        if (montado && Array.isArray(datos)) {
          setReservas(datos);
        }
      })
      .catch((err) => {
        console.error('Error al cargar reservas para dashboard:', err);
      });
    return () => { montado = false; };
  }, []);

  // Mes y Año calculados con el offset
  const fechaCalendario = React.useMemo(() => {
    const d = new Date();
    d.setDate(1); // evitar desbordes de fin de mes
    d.setMonth(d.getMonth() + mesOffset);
    return d;
  }, [mesOffset]);

  const mes = fechaCalendario.getMonth();
  const año = fechaCalendario.getFullYear();

  // Mapeo de reservas por fecha (YYYY-MM-DD)
  const mapaReservasPorFecha = React.useMemo(() => {
    const map = new Map<string, ReservaDTO[]>();
    reservas.forEach((r) => {
      if (r.estado === 'cancelada' || !r.fecha_inicio) return;
      try {
        const inicio = new Date(r.fecha_inicio);
        const fin = r.fecha_fin ? new Date(r.fecha_fin) : inicio;
        
        const cur = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
        
        if (cur.getTime() >= end.getTime()) {
          const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
          const arr = map.get(key) || [];
          arr.push(r);
          map.set(key, arr);
        } else {
          let count = 0;
          while (cur.getTime() <= end.getTime() && count < 45) {
            const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
            const arr = map.get(key) || [];
            arr.push(r);
            map.set(key, arr);
            cur.setDate(cur.getDate() + 1);
            count++;
          }
        }
      } catch (e) {
        // Ignorar fechas inválidas
      }
    });
    return map;
  }, [reservas]);

  // Generación de celdas de la grilla mensual
  const diasGrilla = React.useMemo(() => {
    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);
    const diasTotales = ultimoDiaMes.getDate();
    
    // 0 = Domingo, 1 = Lunes -> Ajustamos a 0 = Lunes, 6 = Domingo
    const diaInicioSemana = (primerDiaMes.getDay() + 6) % 7;

    const celdas: Array<{
      dia?: number;
      fecha?: Date;
      fechaKey?: string;
      esMesActual: boolean;
      tieneReserva: boolean;
    }> = [];

    // Celdas vacías antes del primer día del mes
    for (let i = 0; i < diaInicioSemana; i++) {
      celdas.push({ esMesActual: false, tieneReserva: false });
    }

    // Días del mes
    for (let d = 1; d <= diasTotales; d++) {
      const fecha = new Date(año, mes, d);
      const fechaKey = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tieneReserva = mapaReservasPorFecha.has(fechaKey);
      celdas.push({
        dia: d,
        fecha,
        fechaKey,
        esMesActual: true,
        tieneReserva,
      });
    }

    return celdas;
  }, [año, mes, mapaReservasPorFecha]);

  // Reservas del día seleccionado
  const reservasDelDia = React.useMemo(() => {
    if (!diaSeleccionado) return [];
    const key = `${diaSeleccionado.getFullYear()}-${String(diaSeleccionado.getMonth() + 1).padStart(2, '0')}-${String(diaSeleccionado.getDate()).padStart(2, '0')}`;
    return mapaReservasPorFecha.get(key) || [];
  }, [diaSeleccionado, mapaReservasPorFecha]);

  // Total de reservas en el mes actual mostrado
  const totalReservasMes = React.useMemo(() => {
    return reservas.filter((r) => {
      if (r.estado === 'cancelada' || !r.fecha_inicio) return false;
      const f = new Date(r.fecha_inicio);
      return f.getMonth() === mes && f.getFullYear() === año;
    }).length;
  }, [reservas, mes, año]);

  const estanciasVencidas = React.useMemo(() => {
    const lista = alertas?.huespedesPorDesocupar || [];
    return lista.filter((item: any) => {
      const tieneDeuda = Number(item.montoPendienteAproximado || 0) > 0;
      return Boolean(item.estaVencida) && tieneDeuda;
    });
  }, [alertas?.huespedesPorDesocupar]);

  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const totalPaginasSalidas = Math.ceil(estanciasVencidas.length / itemsPorPagina);
  const salidasPaginadas = estanciasVencidas.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  // ─── EFECTOS DINÁMICOS DEL CARD VERDE (HERO) ──────────────────────────
  const heroCardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());

  // Reloj en tiempo real para dinamismo permanente
  React.useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const formatHoraSalida = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return "12:00"; }
  };

  const hora = horaActual.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = usuario?.nombre?.split(' ')[0] || 'Recepcionista';

  const montoInicialCaja = cajaActiva ? Number(cajaActiva.monto_inicial || 0) : 0;
  const ingresosCaja    = cajaActiva ? Number(cajaActiva.monto_ingresos || 0) : 0;
  const egresosCaja     = cajaActiva ? Number(cajaActiva.monto_egresos  || 0) : 0;
  const totalEnCaja     = montoInicialCaja + ingresosCaja - egresosCaja;

  const aperturaHora = cajaActiva?.fecha_apertura
    ? new Date(cajaActiva.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const fechaFormateada = horaActual.toLocaleDateString('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const horasMinutos = horaActual.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).replace(/\s?[aApP][mM]/, ''); // Extrae los dígitos HH:MM

  const segundos = horaActual.getSeconds().toString().padStart(2, '0');
  const ampm = horaActual.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div className="space-y-6">
      
      {/* ─── FILA SUPERIOR: HERO DE BIENVENIDA & MI CAJA DE TURNO ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* HERO BANNER DINÁMICO: ESTADO DEL HOTEL & RELOJ DIGITAL */}
        <div 
          ref={heroCardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#004e37] via-[#003828] to-[#002218] rounded-3xl p-6 lg:p-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/25 flex flex-col justify-between transition-all duration-300"
        >
          
          {/* Orbes de luz flotantes con keyframe animations */}
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute right-28 -bottom-14 h-56 w-56 rounded-full bg-teal-300/15 blur-2xl pointer-events-none animate-float-reverse" />
          <div className="absolute left-1/4 -top-20 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl pointer-events-none animate-pulse-glow" />

          {/* Malla geométrica de textura sutil de fondo */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Spotlight Interactivo que sigue el cursor del mouse */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: mousePos ? 1 : 0,
              background: mousePos 
                ? `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(110, 231, 183, 0.22), transparent 70%)`
                : undefined
            }}
          />

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            
            {/* Header: Saludo a la izquierda y Reloj Digital de Alto Impacto a la derecha */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Saludo y Nombre */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-emerald-200 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>{saludo}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
                  <span>{nombre}</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-emerald-200/80 font-medium capitalize mt-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  <span>{fechaFormateada}</span>
                </div>
              </div>

              {/* RELOJ DIGITAL EN VIVO DE ALTA VISIBILIDAD */}
              <div className="bg-black/35 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 shadow-2xl flex flex-col items-center sm:items-end justify-center relative overflow-hidden group self-start sm:self-auto min-w-[210px]">
                {/* Línea superior de luz esmeralda */}
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/90 mb-0.5">
                  <Clock className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Hora Oficial del Turno</span>
                </div>

                <div className="flex items-baseline select-none">
                  {/* Horas y Minutos */}
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_18px_rgba(52,211,153,0.5)]">
                    {horasMinutos}
                  </span>

                  {/* Segundos en vivo */}
                  <span className="text-xl sm:text-2xl font-mono text-emerald-300 font-bold ml-1 animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                    :{segundos}
                  </span>

                  {/* AM / PM Badge */}
                  <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-400/25 text-emerald-200 border border-emerald-400/40 tracking-wider shadow-2xs">
                    {ampm}
                  </span>
                </div>
              </div>

            </div>

            {/* Tarjetas Flotantes Dinámicas de Métricas de Habitaciones */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* DISPONIBLES */}
              <div className="relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 hover:border-white/35 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/40 cursor-default before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Disponibles</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-200 transition-colors">
                  {resumen?.habitacionesDisponibles ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300/90 font-medium">Listas para Check-In</span>
                </div>
              </div>

              {/* OCUPADAS */}
              <div className="relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 hover:border-white/35 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/40 cursor-default before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Ocupadas</span>
                  <div className="h-8 w-8 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center border border-sky-400/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                    <BedDouble className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-sky-200 transition-colors">
                  {resumen?.habitacionesOcupadas ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span className="text-[10px] text-sky-300/90 font-medium">Huéspedes activos</span>
                </div>
              </div>

              {/* LIMPIEZA */}
              <div className="relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 hover:border-white/35 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/40 cursor-default before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Limpieza</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-200 transition-colors">
                  {resumen?.habitacionesEnLimpieza ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] text-amber-300/90 font-medium">En preparación</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 hover:border-white/35 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/40 cursor-default before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Total</span>
                  <div className="h-8 w-8 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all duration-300">
                    <Hotel className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-100 transition-colors">
                  {resumen?.totalHabitaciones ?? 0}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  <span className="text-[10px] text-white/70 font-medium">Capacidad general</span>
                </div>
              </div>

            </div>

            {/* Barra de Tasa de Ocupación Dinámica con Shimmer */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-bold text-white/90">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
                  <span>Tasa de ocupación actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 font-mono text-xs font-bold text-white shadow-xs">
                    {porcentajeOcupacion}%
                  </span>
                </div>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/15 relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 rounded-full transition-all duration-700 shadow-sm animate-shimmer-wave"
                  style={{ width: `${Math.min(100, Math.max(0, porcentajeOcupacion))}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* TARJETA: MI CAJA DE TURNO */}
        <div className={`rounded-3xl border p-6 flex flex-col justify-between shadow-xs transition-all ${
          cajaActiva 
            ? 'bg-surface-lowest border-outline-variant/60 hover:shadow-md' 
            : 'bg-surface-container-low/70 border-dashed border-outline-variant/80'
        }`}>
          <div>
            {/* Header de Caja */}
            <div className="flex items-start justify-between pb-4 border-b border-outline-variant/50">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${
                  cajaActiva 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">Mi Caja de Turno</p>
                  <p className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-on-surface-variant/70" />
                    {cajaActiva ? `Aperturada a las ${aperturaHora}` : 'Sin turno activo'}
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border tracking-wider shadow-2xs ${
                cajaActiva 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                {cajaActiva && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                {cajaActiva ? 'ABIERTA' : 'CERRADA'}
              </span>
            </div>

            {/* Desglose de Caja */}
            {cajaActiva ? (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant font-medium">Monto Inicial</span>
                  <span className="font-bold font-mono text-on-surface">S/. {montoInicialCaja.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant font-medium">Ingresos Recaudados</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+ S/. {ingresosCaja.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant font-medium">Egresos del Turno</span>
                  <span className="font-bold font-mono text-rose-500">- S/. {egresosCaja.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2.5">
                <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-[210px]">
                  Debe aperturar la caja del día para registrar cobros y alquileres.
                </p>
              </div>
            )}
          </div>

          {/* Caja Destacada: Efectivo Actual */}
          {cajaActiva && (
            <div className="mt-4 bg-surface-container-low/80 dark:bg-surface-container-high/40 rounded-2xl p-4 border border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Efectivo en Caja
                </span>
                <span className="text-[10px] text-on-surface-variant/60 font-medium">Saldo disponible actual</span>
              </div>
              <span className="text-xl font-black font-mono text-primary tracking-tight">
                S/. {totalEnCaja.toFixed(2)}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ─── FILA 2: ACCESOS RÁPIDOS PRINCIPALES ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            label: 'Estancias Activas', 
            sub: 'Control de habitaciones', 
            to: '/estancias', 
            icon: <CalendarDays className="h-5 w-5" />, 
            color: 'text-primary bg-primary/10 border-primary/20' 
          },
          { 
            label: 'Habitaciones', 
            sub: 'Disponibilidad y tarifas', 
            to: '/habitaciones', 
            icon: <BedDouble className="h-5 w-5" />, 
            color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' 
          },
          { 
            label: 'Huéspedes', 
            sub: 'Directorio y DNI', 
            to: '/huespedes', 
            icon: <Users2 className="h-5 w-5" />, 
            color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20' 
          },
          { 
            label: 'Historial Salidas', 
            sub: 'Auditoría de check-outs', 
            to: '/historial', 
            icon: <History className="h-5 w-5" />, 
            color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' 
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group relative overflow-hidden bg-surface-lowest border border-outline-variant/60 hover:border-primary/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.color}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors leading-tight truncate">
                  {item.label}
                </p>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 truncate">
                  {item.sub}
                </p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-xl bg-surface-container-high/60 group-hover:bg-primary group-hover:text-white flex items-center justify-center shrink-0 text-on-surface-variant transition-all">
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── FILA 3: PANEL OPERATIVO (ESTANCIAS VENCIDAS & EGRESOS DE CAJA) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* COLUMNA IZQUIERDA: LISTA DE ESTANCIAS VENCIDAS (2 COLS) */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-xs overflow-hidden flex flex-col min-h-[380px]">
          
          {/* Header del Panel de Vencimientos */}
          <div className="px-6 py-4.5 border-b border-outline-variant/50 bg-surface-container-low/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
                estanciasVencidas.length > 0 
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              }`}>
                {estanciasVencidas.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="font-black text-sm text-on-surface">Estancias Vencidas</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  Huéspedes que han excedido su horario autorizado de checkout
                </p>
              </div>
            </div>

            <div>
              {estanciasVencidas.length > 0 ? (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-xs font-black shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  {estanciasVencidas.length} Vencida{estanciasVencidas.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Al Día
                </span>
              )}
            </div>
          </div>

          {/* Estado Vacío */}
          {estanciasVencidas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3.5 p-12 text-center">
              <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div>
                <p className="text-base font-black text-on-surface">Sin Estancias Vencidas</p>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm font-medium leading-relaxed">
                  Todas las habitaciones ocupadas se encuentran dentro de su tiempo reglamentario sin sobretiempos de salida.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Lista Paginada de Estancias Vencidas */}
              <div className="divide-y divide-outline-variant/30 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div 
                    key={item.estanciaId} 
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-500/[0.02] hover:bg-rose-500/[0.05] transition-colors border-l-4 border-l-rose-500"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Número de Habitación */}
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white font-black text-base flex flex-col items-center justify-center shrink-0 shadow-sm border border-rose-500/30">
                        <span className="text-[9px] uppercase tracking-wider text-rose-200 leading-none">Hab</span>
                        <span className="leading-tight">{item.habitacionNumero}</span>
                      </div>

                      {/* Datos del Huésped */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-on-surface truncate">{item.huespedNombre}</p>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-500/25 rounded-full uppercase tracking-wider">
                            Vencido
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap">
                          <div className="flex items-center gap-1 text-rose-500 font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Límite: <strong>{formatHoraSalida(item.fechaSalidaProgramada)} HRS</strong></span>
                          </div>
                          {item.huespedDni && (
                            <span className="text-[11px] text-on-surface-variant/70 font-mono bg-surface-container-high/60 px-2 py-0.5 rounded-md border border-outline-variant/40">
                              DNI: {item.huespedDni}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Por Cobrar y Botón Gestionar */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Por Cobrar</p>
                        <p className="text-base font-black font-mono text-rose-600 mt-0.5">
                          S/. {Number(item.montoPendienteAproximado || 0).toFixed(2)}
                        </p>
                      </div>
                      <Link 
                        to="/estancias" 
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        Gestionar <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPaginasSalidas > 1 && (
                <div className="px-6 py-3.5 border-t border-outline-variant/40 bg-surface-container-low/40 flex items-center justify-between text-xs">
                  <button 
                    onClick={() => setPaginaSalidas(p => Math.max(p - 1, 1))} 
                    disabled={paginaSalidas === 1} 
                    className="px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    ← Anterior
                  </button>
                  <span className="font-bold text-on-surface-variant">
                    Página {paginaSalidas} de {totalPaginasSalidas}
                  </span>
                  <button 
                    onClick={() => setPaginaSalidas(p => Math.min(p + 1, totalPaginasSalidas))} 
                    disabled={paginaSalidas === totalPaginasSalidas} 
                    className="px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* COLUMNA DERECHA: SALDOS POR COBRAR / POLÍTICAS & EGRESOS DE CAJA (1 COL) */}
        <div className="flex flex-col gap-5">
          
          {/* TARJETA 1 RELEVANTE: MINI CALENDARIO DE RESERVAS */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative overflow-hidden">
            
            <div className="space-y-3.5">
              
              {/* Header del Mini Calendario con Navegación de Mes */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                      Reservas
                    </h4>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      {NOMBRES_MESES[mes]} {año}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setMesOffset(prev => prev - 1)}
                    className="h-7 w-7 rounded-lg border border-outline-variant/60 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setMesOffset(0)}
                    className="px-2 py-0.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container-high text-[10px] font-bold text-on-surface-variant transition-colors cursor-pointer"
                    title="Mes actual"
                  >
                    Hoy
                  </button>
                  <button 
                    onClick={() => setMesOffset(prev => prev + 1)}
                    className="h-7 w-7 rounded-lg border border-outline-variant/60 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Días de la Semana */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DIAS_SEMANA_MINI.map((dia, idx) => (
                  <span key={idx} className="text-[10px] font-extrabold uppercase text-on-surface-variant/70 py-0.5">
                    {dia}
                  </span>
                ))}
              </div>

              {/* Grilla de Días del Mes */}
              <div className="grid grid-cols-7 gap-1">
                {diasGrilla.map((item, idx) => {
                  if (!item.esMesActual || !item.fecha) {
                    return <div key={`empty-${idx}`} className="h-7 sm:h-8" />;
                  }

                  const esDiaHoy = item.fecha.toDateString() === new Date().toDateString();
                  const esSeleccionado = diaSeleccionado?.toDateString() === item.fecha.toDateString();

                  return (
                    <button
                      key={item.fechaKey}
                      onClick={() => item.fecha && setDiaSeleccionado(item.fecha)}
                      className={`h-7 sm:h-8 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative cursor-pointer ${
                        esSeleccionado 
                          ? 'bg-primary text-white shadow-xs scale-105' 
                          : esDiaHoy
                          ? 'bg-emerald-500/15 text-primary border border-primary/40 font-black'
                          : 'hover:bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <span className="leading-none">{item.dia}</span>
                      {item.tieneReserva && (
                        <span className={`h-1 w-1 rounded-full mt-0.5 ${
                          esSeleccionado ? 'bg-white' : 'bg-amber-500'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detalle de Reservas para la Fecha Seleccionada */}
              <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 rounded-2xl p-3 border border-outline-variant/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    {diaSeleccionado?.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                    {reservasDelDia.length} reserva{reservasDelDia.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {reservasDelDia.length > 0 ? (
                  <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1">
                    {reservasDelDia.map((r, i) => (
                      <div 
                        key={r.id || i}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface border border-outline-variant/40"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-black text-[10px] font-mono shrink-0">
                            H{r.habitacion?.numero || '?'}
                          </span>
                          <span className="font-semibold text-on-surface truncate text-[11px]">
                            {r.nombre || r.huesped?.nombre || 'Huésped'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 font-mono shrink-0 ml-2">
                          S/. {Number(r.monto_adelanto || 0).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant/70 font-medium py-1 text-center">
                    Sin reservas para esta fecha
                  </p>
                )}
              </div>

            </div>

            {/* Acciones de Reservas */}
            <div className="pt-3 border-t border-outline-variant/40 mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant/80">
                {totalReservasMes} reserva{totalReservasMes !== 1 ? 's' : ''} en {NOMBRES_MESES[mes]}
              </span>
              <Link 
                to="/reservas"
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary-container px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-all cursor-pointer"
              >
                <span>Ver Todas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>

          {/* TARJETA 2: GESTIÓN DE EGRESOS DE CAJA */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all flex-1">
            <div className="space-y-4">
              
              {/* Header de Egresos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface uppercase tracking-wider">Egresos de Caja</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Gastos operativos e insumos</p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border tracking-wider ${
                  cajaActiva 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                    : 'bg-surface-container text-on-surface-variant/60 border-outline-variant/40'
                }`}>
                  {cajaActiva ? 'Turno Activo' : 'Caja Cerrada'}
                </span>
              </div>

              {/* Monto de Egresos */}
              <div className="bg-surface-container-low/70 dark:bg-surface-container-high/30 p-3.5 rounded-2xl border border-outline-variant/50 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Egresos del Turno</span>
                <span className="text-base font-black font-mono text-rose-500">- S/. {egresosCaja.toFixed(2)}</span>
              </div>

              {/* Guía Explicativa */}
              <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                ¿Necesita dinero para insumos? Solicite la aprobación estimada, realice la compra, y luego adjunte la boleta para liquidarla.
              </p>

            </div>

            {/* Acciones de Egresos */}
            <div className="pt-4 border-t border-outline-variant/40 mt-4 flex flex-col gap-2.5">
              <button 
                onClick={() => setIsModalEgresoOpen(true)} 
                disabled={!cajaActiva} 
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Receipt className="h-4 w-4" /> Solicitar Permiso (Paso 1)
              </button>
              <button 
                onClick={() => setIsPanelEgresoOpen(true)} 
                className="w-full py-2.5 bg-surface border border-outline-variant/60 hover:bg-surface-container-high active:scale-[0.98] text-on-surface-variant hover:text-on-surface text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <History className="h-4 w-4 text-primary" /> Mis Solicitudes (Paso 2)
              </button>
            </div>

          </div>

          {/* Modales */}
          {isModalEgresoOpen && <SolicitudEgresoModal onClose={() => setIsModalEgresoOpen(false)} />}
          {isPanelEgresoOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsPanelEgresoOpen(false)} />
              <div className="w-full max-w-lg bg-surface h-full overflow-hidden shadow-2xl flex flex-col">
                <SolicitudesEgresoPanel onClose={() => setIsPanelEgresoOpen(false)} />
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

