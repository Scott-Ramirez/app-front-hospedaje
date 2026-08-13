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
  Users2
} from 'lucide-react';

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

  const estanciasVencidas = React.useMemo(() => {
    const lista = alertas.huespedesPorDesocupar || [];
    return lista.filter((item: any) => {
      const tieneDeuda = Number(item.montoPendienteAproximado || 0) > 0;
      return Boolean(item.estaVencida) && tieneDeuda;
    });
  }, [alertas.huespedesPorDesocupar]);

  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const totalPaginasSalidas = Math.ceil(estanciasVencidas.length / itemsPorPagina);
  const salidasPaginadas = estanciasVencidas.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  const formatHoraSalida = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return "12:00"; }
  };

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = usuario?.nombre?.split(' ')[0] || 'Recepcionista';

  const montoInicialCaja = cajaActiva ? Number(cajaActiva.monto_inicial || 0) : 0;
  const ingresosCaja    = cajaActiva ? Number(cajaActiva.monto_ingresos || 0) : 0;
  const egresosCaja     = cajaActiva ? Number(cajaActiva.monto_egresos  || 0) : 0;
  const totalEnCaja     = montoInicialCaja + ingresosCaja - egresosCaja;

  const aperturaHora = cajaActiva?.fecha_apertura
    ? new Date(cajaActiva.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#005139] via-[#003d2b] to-[#002a1d] rounded-2xl p-6 text-white shadow-md border border-emerald-800/20">
          <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -right-2 bottom-2 h-28 w-28 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/80">{saludo},</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5 text-white">{nombre}</h2>
              <p className="text-xs text-white/70 mt-1 font-medium capitalize">
                {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <DoorOpen className="h-4 w-4 text-emerald-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Disponibles</p>
                  <p className="text-lg font-black leading-none text-white">{resumen.habitacionesDisponibles}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <BedDouble className="h-4 w-4 text-blue-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Ocupadas</p>
                  <p className="text-lg font-black leading-none text-white">{resumen.habitacionesOcupadas}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Limpieza</p>
                  <p className="text-lg font-black leading-none text-white">{resumen.habitacionesEnLimpieza}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Hotel className="h-4 w-4 text-zinc-300 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase text-white/60">Total</p>
                  <p className="text-lg font-black leading-none text-white">{resumen.totalHabitaciones}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-white/80">
                <span>Tasa de ocupación actual</span>
                <span className="font-mono">{porcentajeOcupacion}%</span>
              </div>
              <div className="h-2 bg-white/15 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 via-amber-300 to-emerald-300 rounded-full transition-all duration-700"
                  style={{ width: `${porcentajeOcupacion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all ${
          cajaActiva ? 'bg-surface-lowest border-outline-variant' : 'bg-surface-container-low border-dashed border-outline-variant/80'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl ${cajaActiva ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-on-surface">Mi Caja de Turno</p>
                <p className={`text-[10px] font-semibold ${cajaActiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                  {cajaActiva ? `Aperturada a las ${aperturaHora}` : 'Sin turno activo'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border tracking-wider ${
              cajaActiva ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              {cajaActiva ? 'ABIERTA' : 'CERRADA'}
            </span>
          </div>

          {cajaActiva ? (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant font-medium">Monto Inicial</span>
                <span className="font-bold font-mono text-on-surface">S/. {montoInicialCaja.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant font-medium">Ingresos Recaudados</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+ S/. {ingresosCaja.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant font-medium">Egresos del Turno</span>
                <span className="font-bold font-mono text-red-500">- S/. {egresosCaja.toFixed(2)}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs font-black text-on-surface uppercase tracking-wider">Efectivo en Caja</span>
                <span className="text-base font-black font-mono text-primary">S/. {totalEnCaja.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-6 text-center space-y-2">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500 mb-1">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-[200px]">
                Debe aperturar la caja del día para registrar cobros y alquileres.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Estancias Activas', sub: 'Control de habitaciones', to: '/estancias', icon: <CalendarDays className="h-5 w-5" />, color: 'text-primary bg-primary/10' },
          { label: 'Habitaciones', sub: 'Disponibilidad y tarifas', to: '/habitaciones', icon: <BedDouble className="h-5 w-5" />, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
          { label: 'Huéspedes', sub: 'Directorio y DNI', to: '/huespedes', icon: <Users2 className="h-5 w-5" />, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
          { label: 'Historial Salidas', sub: 'Auditoría de check-outs', to: '/historial', icon: <History className="h-5 w-5" />, color: 'text-on-surface-variant bg-surface-container-high' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group bg-surface-lowest border border-outline-variant rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <ArrowRight className="h-4 w-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <p className="font-black text-sm text-on-surface leading-tight">{item.label}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-surface-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[360px]">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${estanciasVencidas.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {estanciasVencidas.length > 0 ? <AlertTriangle className="h-4 w-4 animate-bounce" /> : <ShieldCheck className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Estancias Vencidas</h3>
                <p className="text-[10px] text-on-surface-variant font-medium">Huéspedes que han excedido su horario autorizado de checkout</p>
              </div>
            </div>
            <div>
              {estanciasVencidas.length > 0 ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-xs font-black">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
                  {estanciasVencidas.length} Vencida{estanciasVencidas.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold">✓ Al Día</span>
              )}
            </div>
          </div>

          {estanciasVencidas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-black text-on-surface">Sin Estancias Vencidas</p>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm font-medium">
                  Todas las habitaciones ocupadas se encuentran dentro de su tiempo reglamentario.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-outline-variant/30 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div key={item.estanciaId} className="px-5 py-4 flex items-center gap-4 bg-red-500/3 hover:bg-red-500/5 transition-colors border-l-4 border-l-red-500">
                    <div className="h-12 w-12 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {item.habitacionNumero}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-on-surface truncate">{item.huespedNombre}</p>
                        <span className="shrink-0 text-[9px] font-black px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full uppercase tracking-wider">Vencido</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                        <div className="flex items-center gap-1 text-red-500 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Límite: <strong>{formatHoraSalida(item.fechaSalidaProgramada)} HRS</strong></span>
                        </div>
                        {item.huespedDni && <span className="text-[10px] text-on-surface-variant/70 font-mono">DNI: {item.huespedDni}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Por Cobrar</p>
                        <p className="text-sm font-black font-mono text-red-600 mt-0.5">S/. {Number(item.montoPendienteAproximado).toFixed(2)}</p>
                      </div>
                      <Link to="/estancias" className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                        Gestionar <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {totalPaginasSalidas > 1 && (
                <div className="px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/30 flex items-center justify-between text-xs">
                  <button onClick={() => setPaginaSalidas(p => Math.max(p - 1, 1))} disabled={paginaSalidas === 1} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">← Anterior</button>
                  <span className="font-bold text-on-surface-variant">Pág. {paginaSalidas} de {totalPaginasSalidas}</span>
                  <button onClick={() => setPaginaSalidas(p => Math.min(p + 1, totalPaginasSalidas))} disabled={paginaSalidas === totalPaginasSalidas} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Siguiente →</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm bg-surface-lowest ${
            estanciasVencidas.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            {estanciasVencidas.length > 0 ? (
              <>
                <div className="h-14 w-14 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center animate-pulse shadow-sm">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-red-600">{estanciasVencidas.length}</h4>
                  <p className="text-xs font-bold text-red-600/90">Estancias Vencidas</p>
                </div>
                <Link to="/estancias" className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-xs">
                  Ver Estancias <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <div className="h-14 w-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Sin Sobretiempos</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1 max-w-[190px] leading-relaxed font-medium">Todos los huéspedes en hospedaje se encuentran dentro de su plazo contratado.</p>
                </div>
              </>
            )}
          </div>

          <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-sm flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-black text-on-surface uppercase tracking-wider">Egresos de Caja</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cajaActiva ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-surface-container text-on-surface-variant/60 border-outline-variant/40'}`}>{cajaActiva ? 'Turno Activo' : 'Caja Cerrada'}</span>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">Egresos del Turno</span>
                <span className="text-sm font-black font-mono text-red-500">- S/. {egresosCaja.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">¿Necesita dinero para insumos? Solicite la aprobación estimada, realice la compra, y luego adjunte la boleta para liquidarla.</p>
            </div>
            <div className="pt-3 border-t border-outline-variant/40 mt-3 flex flex-col gap-2">
              <button onClick={() => setIsModalEgresoOpen(true)} disabled={!cajaActiva} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                <Receipt className="h-4 w-4" /> Solicitar Permiso (Paso 1)
              </button>
              <button onClick={() => setIsPanelEgresoOpen(true)} className="w-full py-2.5 bg-surface border border-outline-variant hover:bg-surface-container-high active:scale-[0.98] text-on-surface-variant hover:text-on-surface text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                <History className="h-4 w-4 text-primary" /> Mis Solicitudes (Paso 2)
              </button>
            </div>
          </div>

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
