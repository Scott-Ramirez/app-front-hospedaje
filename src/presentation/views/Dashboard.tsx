import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useBitacora } from '../hooks/useBitacora';
import { useAuth } from '../context/AuthContext';
import { useCajaSesion } from '../context/CajaSesionContext';
import { 
  DoorOpen, 
  BedDouble, 
  Sparkles, 
  Hotel, 
  AlertCircle, 
  Calendar,
  CalendarDays,
  Receipt, 
  Loader2, 
  RefreshCw,
  User,
  Users2,
  Clock,
  Coins,
  TrendingDown,
  Activity,
  History,
  UserCog,
  Settings,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

// ========================================================
// 📱 1. VISTA DE DASHBOARD OPERATIVO (Recepcionistas)
// ========================================================
const GeneralDashboardView: React.FC<{
  data: any;
  porcentajeOcupacion: number;
}> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;
  const { usuario } = useAuth();
  const { cajaActiva } = useCajaSesion();

  // Paginación local para evitar romper el diseño vertical
  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const listaSalidas = alertas.huespedesPorDesocupar || [];
  const totalPaginasSalidas = Math.ceil(listaSalidas.length / itemsPorPagina);
  const salidasPaginadas = listaSalidas.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  const formatHoraSalida = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return "12:00"; }
  };

  // Hora del día para saludo
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = usuario?.nombre?.split(' ')[0] || 'Recepcionista';

  // Estado del turno de caja
  const montoInicialCaja = cajaActiva ? Number(cajaActiva.monto_inicial || 0) : 0;
  const ingresosCaja    = cajaActiva ? Number(cajaActiva.monto_ingresos || 0) : 0;
  const egresosCaja     = cajaActiva ? Number(cajaActiva.monto_egresos  || 0) : 0;
  const totalEnCaja     = montoInicialCaja + ingresosCaja - egresosCaja;

  const aperturaHora = cajaActiva?.fecha_apertura
    ? new Date(cajaActiva.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="space-y-6">

      {/* ── HERO DE BIENVENIDA + ESTADO DE CAJA ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Saludo + identidad del turno */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#005139] to-[#002a1d] rounded-2xl p-6 text-white shadow-lg">
          {/* Decoración */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -right-2 bottom-2 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col h-full gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">{saludo},</p>
              <h2 className="text-2xl font-black tracking-tight mt-0.5">{nombre} 👋</h2>
              <p className="text-xs text-white/60 mt-1 font-medium">
                {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Mini KPIs de habitaciones */}
            <div className="flex flex-wrap gap-3 mt-auto">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <DoorOpen className="h-4 w-4 text-emerald-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Disponibles</p>
                  <p className="text-base font-black leading-none text-white">{resumen.habitacionesDisponibles}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <BedDouble className="h-4 w-4 text-blue-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Ocupadas</p>
                  <p className="text-base font-black leading-none text-white">{resumen.habitacionesOcupadas}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Limpieza</p>
                  <p className="text-base font-black leading-none text-white">{resumen.habitacionesEnLimpieza}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <Hotel className="h-4 w-4 text-zinc-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Total</p>
                  <p className="text-base font-black leading-none text-white">{resumen.totalHabitaciones}</p>
                </div>
              </div>
            </div>

            {/* Barra de ocupación */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/70">
                <span>Tasa de ocupación del hotel</span>
                <span>{porcentajeOcupacion}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-700"
                  style={{ width: `${porcentajeOcupacion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estado de caja del turno */}
        <div className={`rounded-2xl border p-5 flex flex-col gap-4 shadow-sm ${
          cajaActiva
            ? 'bg-surface-lowest border-outline-variant'
            : 'bg-surface-container-low border-dashed border-outline-variant/60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${cajaActiva ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                <Coins className={`h-4 w-4 ${cajaActiva ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Mi Caja</p>
                <p className={`text-[9px] font-medium ${cajaActiva ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {cajaActiva ? `Activa desde las ${aperturaHora}` : 'Sin turno activo'}
                </p>
              </div>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
              cajaActiva
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              {cajaActiva ? 'ABIERTA' : 'CERRADA'}
            </span>
          </div>

          {cajaActiva ? (
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Fondo inicial</span>
                <span className="font-bold font-mono">S/. {montoInicialCaja.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Ingresos del turno</span>
                <span className="font-bold font-mono text-emerald-600">+ S/. {ingresosCaja.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Egresos aprobados</span>
                <span className="font-bold font-mono text-error">- S/. {egresosCaja.toFixed(2)}</span>
              </div>
              <div className="border-t border-outline-variant/50 pt-2.5 flex justify-between">
                <span className="text-xs font-black text-on-surface">Total en Caja</span>
                <span className="text-sm font-black font-mono text-primary">S/. {totalEnCaja.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-4 text-center space-y-2">
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Para operar, primero debes aperturar tu caja de turno.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ver Estancias', sub: 'Huéspedes activos', to: '/estancias', icon: <CalendarDays className="h-5 w-5" />, color: 'text-primary bg-primary/10' },
          { label: 'Habitaciones', sub: 'Estado de cuartos', to: '/habitaciones', icon: <BedDouble className="h-5 w-5" />, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
          { label: 'Huéspedes', sub: 'Buscar registro', to: '/huespedes', icon: <Users2 className="h-5 w-5" />, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
          { label: 'Historial', sub: 'Checkouts pasados', to: '/historial', icon: <History className="h-5 w-5" />, color: 'text-on-surface-variant bg-surface-container-high' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group bg-surface-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <p className="font-black text-sm text-on-surface leading-tight">{item.label}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{item.sub}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all mt-auto" />
          </Link>
        ))}
      </div>

      {/* ── OPERATIVA DEL TURNO ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Checkouts del turno */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[340px]">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Checkouts del Turno</h3>
            </div>
            <div className="flex items-center gap-2">
              {listaSalidas.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {listaSalidas.length} pendientes
                </span>
              )}
            </div>
          </div>

          {listaSalidas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-2xl">✅</div>
              <p className="text-sm font-bold text-on-surface">Sin salidas pendientes</p>
              <p className="text-xs text-on-surface-variant">No hay huéspedes programados para hoy.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-outline-variant/30 flex-1">
                {salidasPaginadas.map((item: any) => {
                  const estaVencido = new Date(item.fechaSalidaProgramada) < new Date();
                  return (
                    <div key={item.estanciaId} className={`px-5 py-4 flex items-center gap-4 hover:bg-surface-container-lowest transition-colors ${estaVencido ? 'bg-error/3' : ''}`}>
                      {/* Número de habitación */}
                      <div className={`h-11 w-11 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm ${
                        estaVencido ? 'bg-error text-white' : 'bg-primary text-on-primary'
                      }`}>
                        {item.habitacionNumero}
                      </div>

                      {/* Info del huésped */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-on-surface truncate">{item.huespedNombre}</p>
                          {estaVencido && (
                            <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 bg-error/10 text-error border border-error/20 rounded-full uppercase">Vencido</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-0.5">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Checkout límite: <strong>{formatHoraSalida(item.fechaSalidaProgramada)} HRS</strong></span>
                        </div>
                      </div>

                      {/* Deuda */}
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Por cobrar</p>
                        <p className={`text-sm font-black mt-0.5 ${item.montoPendienteAproximado > 0 ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {item.montoPendienteAproximado > 0
                            ? `S/. ${item.montoPendienteAproximado.toFixed(2)}`
                            : '✓ Al día'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPaginasSalidas > 1 && (
                <div className="px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/30 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setPaginaSalidas(p => Math.max(p - 1, 1))}
                    disabled={paginaSalidas === 1}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >← Anterior</button>
                  <span className="font-bold text-on-surface-variant">Pág. {paginaSalidas} / {totalPaginasSalidas}</span>
                  <button
                    onClick={() => setPaginaSalidas(p => Math.min(p + 1, totalPaginasSalidas))}
                    disabled={paginaSalidas === totalPaginasSalidas}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >Siguiente →</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel lateral: Alertas + estado */}
        <div className="flex flex-col gap-4">

          {/* Alerta de vencidos */}
          <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm ${
            alertas.totalVencidas > 0
              ? 'bg-error/5 border-error/20'
              : 'bg-green-500/5 border-green-500/20 bg-surface-lowest'
          }`}>
            {alertas.totalVencidas > 0 ? (
              <>
                <div className="h-14 w-14 bg-error/10 text-error rounded-2xl flex items-center justify-center animate-pulse">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-error">{alertas.totalVencidas}</h4>
                  <p className="text-xs font-bold text-error/80">Estancia{alertas.totalVencidas > 1 ? 's' : ''} vencida{alertas.totalVencidas > 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                    Huéspedes con tiempo expirado sin check-out.
                  </p>
                </div>
                <Link
                  to="/estancias"
                  className="inline-flex items-center gap-1.5 text-[10px] font-black text-error border border-error/30 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors"
                >
                  Ver estancias <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">🛡️</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Sin sobretiempos</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Todos los huéspedes están en horario autorizado.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Estado de solicitudes de egreso */}
          <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-3 shadow-sm flex-1">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <p className="text-xs font-black text-on-surface uppercase tracking-wider">Egresos del turno</p>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Para solicitar un gasto de caja, usa el botón <strong>"Solicitar Egreso"</strong> en el menú lateral. Un administrador o supervisor deberá aprobarlo.
            </p>
            <div className="flex items-center gap-1.5 mt-auto">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Requiere aprobación</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};



// ========================================================
// 🔎 2. VISTA DE DASHBOARD INTERMEDIO (Supervisores)
// ========================================================
const SupervisorDashboardView: React.FC<{
  data: any;
  porcentajeOcupacion: number;
}> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;

  // El supervisor puede ver la bitácora de actividades y gastos para auditar el mostrador,
  // pero no tiene visibilidad del consolidado financiero de caja neta del hotel.
  const { actividades, gastos } = useBitacora();

  // Paginación local de salidas del turno
  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const listaSalidas = alertas.huespedesPorDesocupar || [];
  const totalPaginasSalidas = Math.ceil(listaSalidas.length / itemsPorPagina);
  const salidasPaginadas = listaSalidas.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  const formatHoraSalida = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "12:00";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Bento Bento Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DISPONIBLES */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Disponibles</p>
            <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
              <DoorOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <h3 className="text-3xl font-bold">{resumen.habitacionesDisponibles}</h3>
            <span className="text-xs text-on-surface-variant font-medium">unidades</span>
          </div>
        </div>

        {/* OCUPADAS */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Ocupadas</p>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <BedDouble className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">{resumen.habitacionesOcupadas}</h3>
              <span className="text-xs text-on-surface-variant font-medium">de {resumen.totalHabitaciones}</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-blue-500 h-full transition-all duration-500" 
                style={{ width: `${porcentajeOcupacion}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{porcentajeOcupacion}% de Ocupación</p>
          </div>
        </div>

        {/* EN LIMPIEZA */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">En Limpieza</p>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <h3 className="text-3xl font-bold">{resumen.habitacionesEnLimpieza}</h3>
            <span className="text-xs text-on-surface-variant font-medium">por revisar</span>
          </div>
        </div>

        {/* TOTAL */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Total Unidades</p>
            <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg">
              <Hotel className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold">{resumen.totalHabitaciones}</h3>
            <p className="text-[10px] text-on-surface-variant uppercase font-medium mt-1">Capacidad Instalada</p>
          </div>
        </div>
      </div>

      {/* BLOQUES OPERATIVOS Y SUPERVISIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Huéspedes por desocupar */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Huéspedes por Desocupar Hoy</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                {listaSalidas.length} programados
              </span>
            </div>

            {listaSalidas.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                <span className="text-2xl mb-2">🛎️</span>
                <p className="text-sm font-medium text-on-surface-variant">Sin salidas agendadas para el turno actual.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/40 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div key={item.estanciaId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-surface-container-lowest">
                    <div className="flex items-start gap-3.5">
                      <div className="bg-primary text-white h-11 w-11 rounded-xl font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                        {item.habitacionNumero}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-on-surface-variant/70" />
                          <p className="font-bold text-sm text-on-surface leading-none">{item.huespedNombre}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Check-out límite: <strong>{formatHoraSalida(item.fechaSalidaProgramada)} HRS</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cuentas por Cobrar</p>
                        <p className={`text-base font-black mt-0.5 ${item.montoPendienteAproximado > 0 ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          S/. {item.montoPendienteAproximado.toFixed(2)}
                        </p>
                      </div>
                      {item.montoPendienteAproximado > 0 && (
                        <div className="p-2 bg-error/5 text-error rounded-lg" title="Monto Pendiente">
                          <Receipt className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barra de Paginación */}
          {totalPaginasSalidas > 1 && (
            <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/20 text-xs mt-auto">
              <button
                onClick={() => setPaginaSalidas(prev => Math.max(prev - 1, 1))}
                disabled={paginaSalidas === 1}
                className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <span className="font-bold text-on-surface-variant">
                Página {paginaSalidas} de {totalPaginasSalidas}
              </span>
              <button
                onClick={() => setPaginaSalidas(prev => Math.min(prev + 1, totalPaginasSalidas))}
                disabled={paginaSalidas === totalPaginasSalidas}
                className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Timeline de Actividad Reciente */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Actividad en Recepción</h3>
            </div>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto max-h-[320px]">
            {actividades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <span className="text-lg">📜</span>
                <p className="text-xs text-on-surface-variant mt-1">No se registran actividades hoy.</p>
              </div>
            ) : (
              <div className="relative border-l border-outline-variant/65 ml-3 pl-4 space-y-5 py-2">
                {actividades.slice(0, 5).map((act) => (
                  <div key={act.id} className="relative text-left">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-surface-lowest" />
                    <p className="text-xs font-bold text-on-surface leading-snug">{act.accion}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant font-medium">
                      <span className="capitalize bg-surface-container-high px-1.5 py-0.5 rounded font-bold text-primary">
                        {act.usuario || 'recepción'}
                      </span>
                      <span>•</span>
                      <span>{new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOQUE DE CONTROL DE GASTOS Y ATENCIÓN URGENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auditoría Rápida de Egresos */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col lg:col-span-2">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-error" />
              <h3 className="font-bold text-sm text-on-surface">Egresos y Retiros Recientes</h3>
            </div>
            <span className="px-2.5 py-0.5 bg-error/10 text-error rounded-full text-xs font-bold">
              Turno actual
            </span>
          </div>

          <div className="p-5 flex-1">
            {gastos.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <span className="text-xl mb-1">💸</span>
                <p className="text-xs text-on-surface-variant">No se registran egresos de caja hoy.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold">
                      <th className="py-2 pb-3 w-1/4">Hora</th>
                      <th className="py-2 pb-3 w-1/4">Concepto</th>
                      <th className="py-2 pb-3 w-1/4 text-center">Registrado por</th>
                      <th className="py-2 pb-3 w-1/4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 font-medium">
                    {gastos.slice(0, 3).map((g) => (
                      <tr key={g.id} className="hover:bg-surface-container-lowest/30">
                        <td className="py-2.5 font-mono text-[10px] text-on-surface-variant">
                          {new Date(g.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 truncate max-w-[150px]" title={g.concepto}>{g.concepto}</td>
                        <td className="py-2.5 text-center capitalize">{g.usuario}</td>
                        <td className="py-2.5 text-right font-bold text-error">S/. {Number(g.monto).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sobretierpos en Habitaciones */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-error" />
              <h3 className="font-bold text-sm text-on-surface">Habitaciones en Alerta</h3>
            </div>
          </div>
          
          <div className="p-6 flex flex-col items-center justify-center text-center flex-1 space-y-4">
            {alertas.totalVencidas > 0 ? (
              <>
                <div className="h-14 w-14 bg-error/10 text-error rounded-2xl flex items-center justify-center animate-pulse">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-error">
                    {alertas.totalVencidas} Habitación{alertas.totalVencidas > 1 ? 'es' : ''} Vencida{alertas.totalVencidas > 1 ? 's' : ''}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed px-2">
                    Coordinar de inmediato con recepción para la cobranza o liberación del cuarto.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-on-surface">Operación Normal</h4>
                  <p className="text-[11px] text-on-surface-variant px-4 leading-normal">
                    Todos los huéspedes activos se encuentran en sus horarios autorizados.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ACCESOS DIRECTOS DEL SUPERVISOR */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h4 className="text-xs font-black text-primary uppercase tracking-wider">Consola de Control del Supervisor</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Supervise la limpieza de habitaciones y modifique tarifas pactadas.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/habitaciones"
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all"
          >
            <BedDouble className="h-4 w-4 text-primary" />
            <span>Monitoreo de Cuartos</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <Link
            to="/configuraciones"
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all"
          >
            <Settings className="h-4 w-4 text-on-surface-variant" />
            <span>Configuración</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </div>
  );
};

// ========================================================
// 👑 3. VISTA DE DASHBOARD COMPLETO Y FINANCIERO (Para el Admin)
// ========================================================
const AdminDashboardView: React.FC<{
  data: any;
  porcentajeOcupacion: number;
}> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;

  // Cargamos data financiera y actividades exclusiva de Admin de forma aislada
  const { totalGastos, actividades, pagos } = useBitacora();

  // Paginación local para salidas del turno en Admin
  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const listaSalidas = alertas.huespedesPorDesocupar || [];
  const totalPaginasSalidas = Math.ceil(listaSalidas.length / itemsPorPagina);
  const salidasPaginadas = listaSalidas.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const balanceNeto = totalIngresos - totalGastos;

  const formatHoraSalida = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "12:00";
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 💳 SECCIÓN 1: BENTO FINANCIERO / FLUJO DE CAJA */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Resumen de Caja y Flujo de Fondos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* INGRESOS */}
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-green-500/5 group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ingresos por Estancias</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">S/. {totalIngresos.toFixed(2)}</h3>
              <p className="text-[9px] text-on-surface-variant">Total recaudado por adelantos, abonos y checkouts</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 relative z-10">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          {/* EGRESOS */}
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-error/5 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Egresos / Gastos</span>
              <h3 className="text-2xl font-black text-error">S/. {totalGastos.toFixed(2)}</h3>
              <p className="text-[9px] text-on-surface-variant font-medium">Registrados en la bitácora de caja</p>
            </div>
            <div className="p-3 bg-error/10 text-error rounded-xl shrink-0 relative z-10">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          {/* BALANCE NETO */}
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-primary/5 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Flujo Neto en Caja</span>
              <h3 className={`text-2xl font-black ${balanceNeto >= 0 ? 'text-primary' : 'text-error'}`}>
                S/. {balanceNeto.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant">Caja disponible real calculada</p>
            </div>
            <div className={`p-3 rounded-xl shrink-0 relative z-10 ${balanceNeto >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 🏨 SECCIÓN 2: INFRAESTRUCTURA DE HABITACIONES */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Ocupación y Habitaciones</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Disponibles</p>
              <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                <DoorOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">{resumen.habitacionesDisponibles}</h3>
              <span className="text-xs text-on-surface-variant font-medium">unidades</span>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Ocupadas</p>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <BedDouble className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{resumen.habitacionesOcupadas}</h3>
                <span className="text-xs text-on-surface-variant font-medium">de {resumen.totalHabitaciones}</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${porcentajeOcupacion}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{porcentajeOcupacion}% de Ocupación</p>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">En Limpieza</p>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">{resumen.habitacionesEnLimpieza}</h3>
              <span className="text-xs text-on-surface-variant font-medium">por revisar</span>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Total Unidades</p>
              <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg">
                <Hotel className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold">{resumen.totalHabitaciones}</h3>
              <p className="text-[10px] text-on-surface-variant uppercase font-medium mt-1">Capacidad Instalada</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 SECCIÓN 3: CONTROL OPERATIVO / ALERTAS & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Huéspedes por desocupar */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Huéspedes por Desocupar Hoy</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                {listaSalidas.length} programados
              </span>
            </div>

            {listaSalidas.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                <span className="text-2xl mb-2">🛎️</span>
                <p className="text-sm font-medium text-on-surface-variant">Sin salidas agendadas para el turno actual.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/40 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div key={item.estanciaId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-surface-container-lowest">
                    <div className="flex items-start gap-3.5">
                      <div className="bg-primary text-white h-11 w-11 rounded-xl font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                        {item.habitacionNumero}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-on-surface-variant/70" />
                          <p className="font-bold text-sm text-on-surface leading-none">{item.huespedNombre}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Check-out límite: <strong>{formatHoraSalida(item.fechaSalidaProgramada)} HRS</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cuentas por Cobrar</p>
                        <p className={`text-base font-black mt-0.5 ${item.montoPendienteAproximado > 0 ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          S/. {item.montoPendienteAproximado.toFixed(2)}
                        </p>
                      </div>
                      {item.montoPendienteAproximado > 0 && (
                        <div className="p-2 bg-error/5 text-error rounded-lg" title="Monto Pendiente">
                          <Receipt className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barra de Paginación */}
          {totalPaginasSalidas > 1 && (
            <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/20 text-xs mt-auto">
              <button
                onClick={() => setPaginaSalidas(prev => Math.max(prev - 1, 1))}
                disabled={paginaSalidas === 1}
                className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <span className="font-bold text-on-surface-variant">
                Página {paginaSalidas} de {totalPaginasSalidas}
              </span>
              <button
                onClick={() => setPaginaSalidas(prev => Math.min(prev + 1, totalPaginasSalidas))}
                disabled={paginaSalidas === totalPaginasSalidas}
                className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Bitácora de operaciones recientes (Exclusivo Admin) */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Actividad Reciente</h3>
            </div>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto max-h-[320px]">
            {actividades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <span className="text-lg">📜</span>
                <p className="text-xs text-on-surface-variant mt-1">No se registran actividades hoy.</p>
              </div>
            ) : (
              <div className="relative border-l border-outline-variant/65 ml-3 pl-4 space-y-5 py-2">
                {actividades.slice(0, 5).map((act) => (
                  <div key={act.id} className="relative text-left">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-surface-lowest" />
                    <p className="text-xs font-bold text-on-surface leading-snug">
                      {act.accion}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant font-medium">
                      <span className="capitalize bg-surface-container-high px-1.5 py-0.5 rounded font-bold text-primary">
                        {act.usuario || 'recepción'}
                      </span>
                      <span>•</span>
                      <span>{new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🚀 SECCIÓN 4: ACCESOS DIRECTOS ADMINISTRATIVOS */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-lowest to-surface-lowest border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black text-primary uppercase tracking-wider">Consola de Control del Administrador</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Gestione personal del hotel, audite los gastos registrados y configure tarifas de hospedaje.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/usuarios"
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all"
          >
            <UserCog className="h-4 w-4 text-amber-500" />
            <span>Gestionar Personal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          
          <Link
            to="/auditoria-caja"
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all"
          >
            <History className="h-4 w-4 text-primary" />
            <span>Ver Auditoría de Caja</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <Link
            to="/configuraciones"
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all"
          >
            <Settings className="h-4 w-4 text-on-surface-variant" />
            <span>Configuración</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </div>
  );
};


// ========================================================
// 🎯 MAIN CONTAINER COMPONENT
// ========================================================
export const Dashboard: React.FC = () => {
  const {
    usuario,
    data,
    loading,
    porcentajeOcupacion,
    cargarDashboard
  } = useDashboard();
  const { verificarCaja } = useCajaSesion();

  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    verificarCaja(true);
  }, [verificarCaja]);

  const handleManualRefresh = async () => {
    setIsReconnecting(true);
    await Promise.all([
      cargarDashboard(),
      verificarCaja(true)
    ]);
    setIsReconnecting(false);
  };

  // Pantalla de carga limpia
  if (loading && !isReconnecting) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute h-2 w-2 bg-primary rounded-full" />
        </div>
        <p className="text-sm font-medium text-on-surface-variant animate-pulse">
          Sincronizando disponibilidad del hospedaje...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-[1280px] mx-auto text-on-surface space-y-8 select-none">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            {usuario?.rol === 'admin' 
              ? 'Panel del Administrador' 
              : usuario?.rol === 'supervisor' 
              ? 'Consola del Supervisor' 
              : 'Panel de Control'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {usuario?.rol === 'admin' 
              ? 'Supervisión integral de finanzas, bitácoras y estado operativo.' 
              : usuario?.rol === 'supervisor'
              ? 'Monitoreo de actividades de recepción, auditoría de egresos y control de habitaciones.'
              : 'Estado operativo e infraestructura en tiempo real.'}
          </p>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isReconnecting}
          className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-low text-on-surface-variant text-xs font-bold px-4 py-2.5 rounded-lg border border-outline-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`} /> 
          Actualizar Estado
        </button>
      </div>

      {/* RENDERIZADO CONDICIONAL DE LA VISTA SEGÚN EL ROL DE SEGURIDAD */}
      {usuario?.rol === 'admin' ? (
        <AdminDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      ) : usuario?.rol === 'supervisor' ? (
        <SupervisorDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      ) : (
        <GeneralDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      )}

    </div>
  );
};

export default Dashboard;