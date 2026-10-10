import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBitacora } from '../../hooks/useBitacora';
import { 
  DoorOpen, 
  BedDouble, 
  Sparkles, 
  Hotel, 
  AlertCircle, 
  History, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Activity,
  Coins,
  TrendingUp,
  TrendingDown,
  UserCog,
  Settings
} from 'lucide-react';

interface AdminDashboardViewProps {
  data: any;
  porcentajeOcupacion: number;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;
  const { actividades, pagos, gastos } = useBitacora();

  // Estados para filtro de período contable
  const [periodoFiltro, setPeriodoFiltro] = useState<'mes_actual' | 'mes_anterior' | 'historico'>('mes_actual');
  
  // Mes actual y mes anterior
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const fechaMesAnterior = new Date(anioActual, mesActual - 1, 1);
  const mesAnterior = fechaMesAnterior.getMonth();
  const anioMesAnterior = fechaMesAnterior.getFullYear();

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const nombreMesActual = `${mesesNombres[mesActual]} ${anioActual}`;
  const nombreMesAnterior = `${mesesNombres[mesAnterior]} ${anioMesAnterior}`;

  // 1. Mes actual
  const pagosMesActual = React.useMemo(() => pagos.filter((p: any) => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }), [pagos, mesActual, anioActual]);

  const gastosMesActual = React.useMemo(() => gastos.filter((g: any) => {
    if (!g.fecha) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }), [gastos, mesActual, anioActual]);

  const ingresosMesActual = React.useMemo(() => pagosMesActual.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagosMesActual]);
  const egresosMesActual = React.useMemo(() => gastosMesActual.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastosMesActual]);
  const balanceMesActual = ingresosMesActual - egresosMesActual;

  // 2. Mes anterior
  const pagosMesAnterior = React.useMemo(() => pagos.filter((p: any) => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === mesAnterior && d.getFullYear() === anioMesAnterior;
  }), [pagos, mesAnterior, anioMesAnterior]);

  const gastosMesAnterior = React.useMemo(() => gastos.filter((g: any) => {
    if (!g.fecha) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesAnterior && d.getFullYear() === anioMesAnterior;
  }), [gastos, mesAnterior, anioMesAnterior]);

  const ingresosMesAnterior = React.useMemo(() => pagosMesAnterior.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagosMesAnterior]);
  const egresosMesAnterior = React.useMemo(() => gastosMesAnterior.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastosMesAnterior]);
  const balanceMesAnterior = ingresosMesAnterior - egresosMesAnterior;

  // 3. Total histórico
  const ingresosHistorico = React.useMemo(() => pagos.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagos]);
  const egresosHistorico = React.useMemo(() => gastos.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastos]);
  const balanceHistorico = ingresosHistorico - egresosHistorico;

  // Cifras a mostrar según el selector
  const { ingresosMostrados, egresosMostrados, balanceMostrado, etiquetaPeriodo, descripcionSubtexto } = React.useMemo(() => {
    if (periodoFiltro === 'mes_actual') {
      return {
        ingresosMostrados: ingresosMesActual,
        egresosMostrados: egresosMesActual,
        balanceMostrado: balanceMesActual,
        etiquetaPeriodo: `Mes Actual (${nombreMesActual})`,
        descripcionSubtexto: `Generado en ${nombreMesActual} (se reinicia al cerrar el mes)`,
      };
    }
    if (periodoFiltro === 'mes_anterior') {
      return {
        ingresosMostrados: ingresosMesAnterior,
        egresosMostrados: egresosMesAnterior,
        balanceMostrado: balanceMesAnterior,
        etiquetaPeriodo: `Mes Anterior (${nombreMesAnterior})`,
        descripcionSubtexto: `Cierre contable de ${nombreMesAnterior}`,
      };
    }
    return {
      ingresosMostrados: ingresosHistorico,
      egresosMostrados: egresosHistorico,
      balanceMostrado: balanceHistorico,
      etiquetaPeriodo: 'Acumulado Histórico Total',
      descripcionSubtexto: 'Total histórico consolidado de todos los períodos',
    };
  }, [periodoFiltro, ingresosMesActual, egresosMesActual, balanceMesActual, ingresosMesAnterior, egresosMesAnterior, balanceMesAnterior, ingresosHistorico, egresosHistorico, balanceHistorico, nombreMesActual, nombreMesAnterior]);

  const estanciasVencidasAdmin = React.useMemo(() => {
    const lista = alertas.huespedesPorDesocupar || [];
    return lista.filter((item: any) => Boolean(item.estaVencida) && Number(item.montoPendienteAproximado || 0) > 0);
  }, [alertas.huespedesPorDesocupar]);

  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const totalPaginasSalidas = Math.ceil(estanciasVencidasAdmin.length / itemsPorPagina);
  const salidasPaginadas = estanciasVencidasAdmin.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: BENTO FINANCIERO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Resumen de Caja y Flujo de Fondos
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Mostrando: <span className="font-bold text-primary">{etiquetaPeriodo}</span>
            </p>
          </div>

          {/* Selector de Período */}
          <div className="flex items-center bg-surface-lowest border border-outline-variant p-1 rounded-xl gap-1 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setPeriodoFiltro('mes_actual')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'mes_actual'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Mes Actual
            </button>
            <button
              type="button"
              onClick={() => setPeriodoFiltro('mes_anterior')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'mes_anterior'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={() => setPeriodoFiltro('historico')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'historico'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Total Histórico
            </button>
          </div>
        </div>

        {/* Tarjetas Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-green-500/5 group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Ingresos por Estancias {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Totales'}
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                S/. {ingresosMostrados.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant">{descripcionSubtexto}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 relative z-10">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-error/5 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Egresos / Gastos {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Totales'}
              </span>
              <h3 className="text-2xl font-black text-error">
                S/. {egresosMostrados.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant font-medium">Registrados en la bitácora de caja</p>
            </div>
            <div className="p-3 bg-error/10 text-error rounded-xl shrink-0 relative z-10">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-primary/5 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Flujo Neto en Caja {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Total'}
              </span>
              <h3 className={`text-2xl font-black ${balanceMostrado >= 0 ? 'text-primary' : 'text-error'}`}>
                S/. {balanceMostrado.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant">Caja disponible neta calculada</p>
            </div>
            <div className={`p-3 rounded-xl shrink-0 relative z-10 ${balanceMostrado >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Barra comparativa mensual */}
        <div className="bg-surface-lowest border border-outline-variant px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant shadow-xs">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-[11px] uppercase tracking-wider">Comparador Rápido:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className={periodoFiltro === 'mes_actual' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              📅 Mes Actual ({mesesNombres[mesActual]}): <strong className={balanceMesActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}>S/. {balanceMesActual.toFixed(2)}</strong>
            </span>
            <span className="text-outline-variant">|</span>
            <span className={periodoFiltro === 'mes_anterior' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              ⏮️ Mes Anterior ({mesesNombres[mesAnterior]}): <strong className={balanceMesAnterior >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}>S/. {balanceMesAnterior.toFixed(2)}</strong>
            </span>
            <span className="text-outline-variant">|</span>
            <span className={periodoFiltro === 'historico' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              🌐 Histórico Total: <strong className={balanceHistorico >= 0 ? 'text-primary' : 'text-error'}>S/. {balanceHistorico.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: HABITACIONES */}
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

      {/* SECCIÓN 3: CONTROL OPERATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estancias Vencidas */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-sm text-on-surface">Estancias Vencidas</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                estanciasVencidasAdmin.length > 0
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}>
                {estanciasVencidasAdmin.length > 0 ? `${estanciasVencidasAdmin.length} con saldo pendiente` : '\u2713 Todo al día'}
              </span>
            </div>

            {estanciasVencidasAdmin.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Sin estancias vencidas</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Todos los huéspedes están al día con sus pagos.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/40 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div key={item.estanciaId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-500/[0.02] hover:bg-red-500/5 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="bg-red-500 text-white h-11 w-11 rounded-xl font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                        {item.habitacionNumero}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-on-surface-variant/70" />
                          <p className="font-bold text-sm text-on-surface leading-none">{item.huespedNombre}</p>
                        </div>
                        {item.huespedDni && <p className="text-[11px] text-on-surface-variant font-mono">DNI: {item.huespedDni}</p>}
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                          <AlertCircle className="h-2.5 w-2.5" /> Sobretiempo
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Por Cobrar</p>
                      <p className="text-base font-black text-red-500 mt-0.5">S/. {Number(item.montoPendienteAproximado).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPaginasSalidas > 1 && (
            <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/20 text-xs mt-auto">
              <button onClick={() => setPaginaSalidas(prev => Math.max(prev - 1, 1))} disabled={paginaSalidas === 1} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Anterior</button>
              <span className="font-bold text-on-surface-variant">Página {paginaSalidas} de {totalPaginasSalidas}</span>
              <button onClick={() => setPaginaSalidas(prev => Math.min(prev + 1, totalPaginasSalidas))} disabled={paginaSalidas === totalPaginasSalidas} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Siguiente</button>
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
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
                    <p className="text-xs font-bold text-on-surface leading-snug">{act.accion}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant font-medium">
                      <span className="capitalize bg-surface-container-high px-1.5 py-0.5 rounded font-bold text-primary">{act.usuario || 'recepción'}</span>
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

      {/* Accesos Directos */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-lowest to-surface-lowest border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black text-primary uppercase tracking-wider">Consola de Control del Administrador</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">Gestione personal del hotel, audite los gastos registrados y configure tarifas de hospedaje.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/usuarios" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <UserCog className="h-4 w-4 text-amber-500" />
            <span>Gestionar Personal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/auditoria-caja" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <History className="h-4 w-4 text-primary" />
            <span>Ver Auditoría de Caja</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/configuraciones" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <Settings className="h-4 w-4 text-on-surface-variant" />
            <span>Configuración</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </div>
  );
};
