import React, { useState, useMemo } from 'react';
import { useReservas } from '../hooks/useReservas';
import { useHabitaciones } from '../hooks/useHabitaciones';
import { CrearReservaModal } from '../components/reservas/CrearReservaModal';
import { DetalleReservaModal } from '../components/reservas/DetalleReservaModal';
import type { ReservaDTO } from '../../data/repositories/reservas.repository';

import {
  Calendar,
  Grid,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Wind,
  Snowflake,
  Wifi,
  CalendarDays,
  ListFilter,
  Sparkles
} from 'lucide-react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ReservasPanel: React.FC = () => {
  const {
    reservas,
    todasReservas,
    busqueda,
    setBusqueda,
    modalCrearAbierto,
    modalDetalleAbierto,
    habitacionSeleccionada,
    reservaSeleccionada,
    abrirModalCrear,
    cerrarModalCrear,
    abrirModalDetalle,
    cerrarModalDetalle,
    handleCrearReserva,
    handleCancelarReserva,
    handleCheckInReserva,
  } = useReservas();

  const { habitaciones } = useHabitaciones();

  const [pestañaActiva, setPestañaActiva] = useState<'disponibles' | 'calendario'>('disponibles');
  const [vistaCalendario, setVistaCalendario] = useState<'mes' | 'agenda'>('mes');
  const [fechaCalendario, setFechaCalendario] = useState<Date>(new Date());
  const [filtroHabitacion, setFiltroHabitacion] = useState<string>('todas');

  // Paginación para la Grilla de Disponibles (12 items por página)
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 12;

  // Reservas confirmadas activas
  const reservasConfirmadas = useMemo(() => {
    return todasReservas.filter((r: ReservaDTO) => r.estado === 'confirmada');
  }, [todasReservas]);

  // FILTRO: Solo habitaciones que NO tienen ninguna reserva confirmada activa (por ID o por número físico)
  const habitacionesDisponiblesParaReserva = useMemo(() => {
    const idsHabitacionesReservadas = new Set(
      reservasConfirmadas.map((r) => r.habitacionId).filter((id): id is string => Boolean(id))
    );
    const numerosHabitacionesReservadas = new Set(
      reservasConfirmadas.map((r) => r.habitacion?.numero).filter((num): num is string => Boolean(num))
    );
    
    return habitaciones
      .filter((h) => !idsHabitacionesReservadas.has(h.id || '') && !numerosHabitacionesReservadas.has(h.numero || ''))
      .filter((h) =>
        h.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        h.tipo.toLowerCase().includes(busqueda.toLowerCase())
      );
  }, [habitaciones, reservasConfirmadas, busqueda]);

  const totalPaginas = Math.ceil(habitacionesDisponiblesParaReserva.length / itemsPorPagina) || 1;
  const indiceInicial = (paginaActual - 1) * itemsPorPagina;
  const habitacionesPaginadas = habitacionesDisponiblesParaReserva.slice(indiceInicial, indiceInicial + itemsPorPagina);

  // Reservas dentro de las próximas 24 horas
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const reservasProximas24h = useMemo(() => {
    return reservasConfirmadas.filter((r: ReservaDTO) => {
      const inicio = new Date(r.fecha_inicio);
      return inicio <= en24h && inicio >= ahora;
    });
  }, [reservasConfirmadas, ahora, en24h]);

  // Lógica de Cuadrícula Mensual para la Agenda / Calendario
  const celdasCalendario = useMemo(() => {
    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();

    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);

    // Ajuste de inicio de semana: Lunes = 0, ..., Domingo = 6
    const diaInicioSemana = (primerDiaMes.getDay() + 6) % 7;
    const diasEnMes = ultimoDiaMes.getDate();

    const diasMesAnterior = new Date(año, mes, 0).getDate();

    const celdas = [];

    // Días del mes anterior (relleno)
    for (let i = diaInicioSemana - 1; i >= 0; i--) {
      const fecha = new Date(año, mes - 1, diasMesAnterior - i);
      celdas.push({
        fecha,
        numeroDia: diasMesAnterior - i,
        esMesActual: false,
        esHoy: false,
        reservas: [] as ReservaDTO[],
      });
    }

    const hoyStr = ahora.toISOString().split('T')[0];

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(año, mes, d);
      const fechaStr = fecha.toISOString().split('T')[0];
      const esHoy = fechaStr === hoyStr;

      // Filtrar reservas que caen en este día
      const cellStart = new Date(año, mes, d, 0, 0, 0).getTime();
      const cellEnd = new Date(año, mes, d, 23, 59, 59).getTime();

      const reservasDelDia = todasReservas.filter((r: ReservaDTO) => {
        if (r.estado === 'cancelada') return false;
        if (filtroHabitacion !== 'todas' && r.habitacionId !== filtroHabitacion) return false;
        const resStart = new Date(r.fecha_inicio).getTime();
        const resEnd = new Date(r.fecha_fin).getTime();
        return resStart <= cellEnd && resEnd >= cellStart;
      });

      celdas.push({
        fecha,
        numeroDia: d,
        esMesActual: true,
        esHoy,
        reservas: reservasDelDia,
      });
    }

    // Días del mes siguiente para completar múltiplos de 7
    const celdasFaltantes = (7 - (celdas.length % 7)) % 7;
    for (let j = 1; j <= celdasFaltantes; j++) {
      const fecha = new Date(año, mes + 1, j);
      celdas.push({
        fecha,
        numeroDia: j,
        esMesActual: false,
        esHoy: false,
        reservas: [] as ReservaDTO[],
      });
    }

    return celdas;
  }, [fechaCalendario, todasReservas, filtroHabitacion, ahora]);

  // Controles de navegación del calendario
  const cambiarMes = (delta: number) => {
    setFechaCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const irAHoy = () => {
    setFechaCalendario(new Date());
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-on-surface">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black">Control & Módulo de Reservas</h2>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Gestión anticipada de estancias, depósitos por adelantado y agenda interactiva de reservas.
          </p>
        </div>

        {/* BOTÓN NUEVA RESERVA Y BÚSQUEDA */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Buscar por habitación, cliente o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-surface border border-outline-variant rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary w-64 text-on-surface"
            />
          </div>

          <button
            onClick={() => abrirModalCrear(null)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* METRICAS Y BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-lowest border border-outline-variant/70 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Reservas Confirmadas</p>
            <h3 className="text-2xl font-black mt-1 text-primary">{reservasConfirmadas.length}</h3>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-surface-lowest border border-amber-500/30 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Próximas (24 Horas)</p>
            <h3 className="text-2xl font-black mt-1 text-amber-600">{reservasProximas24h.length}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl animate-pulse">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-surface-lowest border border-outline-variant/70 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Total Histórico</p>
            <h3 className="text-2xl font-black mt-1">{todasReservas.length}</h3>
          </div>
          <div className="p-3 bg-surface-container-high text-on-surface-variant rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex border-b border-outline-variant mb-6 gap-2">
        <button
          onClick={() => setPestañaActiva('disponibles')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'disponibles'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Grid className="h-4 w-4" /> Habitaciones para Reserva ({habitacionesDisponiblesParaReserva.length})
        </button>

        <button
          onClick={() => setPestañaActiva('calendario')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'calendario'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Calendar className="h-4 w-4" /> Calendario & Agenda de Reservas
        </button>
      </div>

      {/* PESTAÑA 1: HABITACIONES DISPONIBLES (SIN RESERVA) */}
      {pestañaActiva === 'disponibles' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant font-medium">
              Mostrando únicamente habitaciones libres de reservas. Seleccione una habitación para registrar una nueva reserva.
            </p>

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold px-2">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* GRILLA DE HABITACIONES */}
          {habitacionesDisponiblesParaReserva.length === 0 ? (
            <div className="text-center py-16 bg-surface-lowest rounded-2xl border border-outline-variant/60">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-on-surface">Todas las habitaciones cuentan con reserva o no coinciden con la búsqueda.</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Puede consultar el cronograma en la pestaña <strong>Calendario & Agenda</strong> o crear una nueva reserva libremente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {habitacionesPaginadas.map((room) => {
                const esOcupadaActual = room.estado === 'ocupado';
                const esLimpieza = room.estado === 'limpieza';

                return (
                  <div
                    key={room.id}
                    onClick={() => abrirModalCrear(room)}
                    className="group relative border border-outline-variant rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 bg-surface-lowest hover:border-primary"
                  >
                    {/* NUMERO & ESTADO */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg font-black text-on-surface group-hover:text-primary transition-colors">
                          Hab. {room.numero}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          esOcupadaActual ? 'bg-blue-500' :
                          esLimpieza ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                      </div>

                      <p className="text-[11px] font-bold text-on-surface-variant capitalize">
                        {room.tipo === 'simple' ? 'Habitación Simple' : 'Habitación Doble'}
                      </p>

                      {/* ICONOS CARACTERÍSTICAS */}
                      <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant/60 text-xs">
                        {room.dos_camas && <span title="2 Camas"><BedDouble className="h-3.5 w-3.5 text-primary" /></span>}
                        {room.aire_acondicionado && <span title="Aire"><Snowflake className="h-3.5 w-3.5 text-cyan-500" /></span>}
                        {room.ventilador && <span title="Ventilador"><Wind className="h-3.5 w-3.5 text-amber-500" /></span>}
                        {room.wifi && <span title="Wifi"><Wifi className="h-3.5 w-3.5 text-primary" /></span>}
                      </div>
                    </div>

                    {/* PRECIO Y ACCIÓN */}
                    <div className="mt-4 pt-2 border-t border-outline-variant/40">
                      <p className="text-xs font-black text-primary">
                        S/. {Number(room.precio).toFixed(2)} <span className="text-[10px] font-normal text-on-surface-variant">/día</span>
                      </p>

                      <div className="mt-1.5 text-[10px] font-bold text-primary group-hover:underline flex items-center justify-between">
                        <span>Reservar Habitación</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* PESTAÑA 2: CALENDARIO & AGENDA INTERACTIVA */}
      {pestañaActiva === 'calendario' && (
        <div className="space-y-4">
          
          {/* BARRA DE HERRAMIENTAS DEL CALENDARIO */}
          <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            
            {/* NAVEGACIÓN DE MES */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden bg-surface">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="p-2 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={irAHoy}
                  className="px-3 py-1.5 text-xs font-bold hover:bg-surface-container-high border-x border-outline-variant text-primary transition-colors cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  onClick={() => cambiarMes(1)}
                  className="p-2 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-black text-on-surface capitalize">
                {MESES[fechaCalendario.getMonth()]} {fechaCalendario.getFullYear()}
              </h3>
            </div>

            {/* FILTRO DE HABITACIÓN Y SELECTOR DE VISTA */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              
              {/* SELECTOR HABITACIÓN */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-on-surface-variant">Filtrar:</span>
                <select
                  value={filtroHabitacion}
                  onChange={(e) => setFiltroHabitacion(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-on-surface"
                >
                  <option value="todas">Todas las Habitaciones</option>
                  {habitaciones.map((h) => (
                    <option key={h.id} value={h.id}>
                      Hab. {h.numero} ({h.tipo === 'simple' ? 'Simple' : 'Doble'})
                    </option>
                  ))}
                </select>
              </div>

              {/* TOGGLE VISTA MES / AGENDA */}
              <div className="flex border border-outline-variant rounded-xl p-0.5 bg-surface">
                <button
                  onClick={() => setVistaCalendario('mes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    vistaCalendario === 'mes'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" /> Mes
                </button>
                <button
                  onClick={() => setVistaCalendario('agenda')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    vistaCalendario === 'agenda'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" /> Agenda
                </button>
              </div>

            </div>

          </div>

          {/* VISTA 1: CUADRÍCULA CALENDARIO MENSUAL */}
          {vistaCalendario === 'mes' && (
            <div className="bg-surface-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              
              {/* CABECERA DÍAS DE LA SEMANA */}
              <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low text-center text-xs font-black uppercase text-on-surface-variant py-2.5">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="tracking-wider">
                    {dia}
                  </div>
                ))}
              </div>

              {/* CUADRÍCULA DE DÍAS */}
              <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant/40">
                {celdasCalendario.map((celda, idx) => {
                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                        !celda.esMesActual
                          ? 'bg-surface-container-lowest/40 opacity-40'
                          : celda.esHoy
                          ? 'bg-primary/5'
                          : 'hover:bg-surface-container-lowest'
                      }`}
                    >
                      {/* NÚMERO DE DÍA */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                            celda.esHoy
                              ? 'bg-primary text-white shadow-sm'
                              : celda.esMesActual
                              ? 'text-on-surface'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {celda.numeroDia}
                        </span>

                        {celda.reservas.length > 0 && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {celda.reservas.length} {celda.reservas.length === 1 ? 'reserva' : 'res.'}
                          </span>
                        )}
                      </div>

                      {/* EVENTOS / BADGES DE RESERVAS DEL DÍA */}
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {celda.reservas.map((res) => {
                          const esConfirmada = res.estado === 'confirmada';
                          const esCompletada = res.estado === 'completada';

                          return (
                            <div
                              key={res.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalDetalle(res);
                              }}
                              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between gap-1 truncate ${
                                esConfirmada
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
                                  : esCompletada
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20'
                                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                              }`}
                              title={`Hab. ${res.habitacion?.numero} - ${res.huesped?.nombre || res.nombre} - Adelanto: S/. ${res.monto_adelanto}`}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <span className="px-1 py-0.2 bg-black/10 rounded font-black text-[10px]">
                                  {res.habitacion?.numero}
                                </span>
                                <span className="truncate">
                                  {res.huesped?.nombre || res.nombre || 'Huésped'}
                                </span>
                              </div>

                              {res.comprobante_url && (
                                <span className="text-[9px]" title="Tiene comprobante adjunto">📷</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div />
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VISTA 2: LISTA DE AGENDA / CRONOGRAMA */}
          {vistaCalendario === 'agenda' && (
            <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Agenda Cronológica de Reservas
              </h3>

              {reservas.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  No hay reservas registradas en el sistema.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/40">
                  {reservas.map((r: ReservaDTO) => {
                    const inicioFormatted = new Date(r.fecha_inicio).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const finFormatted = new Date(r.fecha_fin).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const inicioDate = new Date(r.fecha_inicio);
                    const finDate = new Date(r.fecha_fin);
                    const diffMs = finDate.getTime() - inicioDate.getTime();
                    const diasEstadia = Math.max(1, Math.ceil((diffMs > 0 ? diffMs : 24 * 3600000) / (1000 * 60 * 60 * 24)));
                    const totalEst = Number(r.monto_total_estimado) || Number(r.monto_adelanto) || 0;
                    const abonoEst = Number(r.monto_adelanto) || 0;
                    const saldoEst = Math.max(0, totalEst - abonoEst);

                    return (
                      <div
                        key={r.id}
                        onClick={() => abrirModalDetalle(r)}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-lowest transition-colors px-3 rounded-xl cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl font-black text-center min-w-[75px]">
                            <span className="block text-xs uppercase font-bold">Hab.</span>
                            <span className="text-xl">{r.habitacion?.numero || 'N/A'}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-on-surface">
                                {r.huesped?.nombre || r.nombre || 'Cliente Reservante'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {diasEstadia} {diasEstadia === 1 ? 'día' : 'días'}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant flex items-center gap-3 mt-0.5">
                              <span>DNI: {r.huesped?.dni || r.dni || 'N/A'}</span>
                              <span>Cel: {r.huesped?.celular || r.celular || 'N/A'}</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary mt-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{inicioFormatted} ➡️ {finFormatted}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between md:justify-end">
                          <div className="text-right">
                            <p className="text-xs font-bold text-on-surface">
                              Total: S/. {totalEst.toFixed(2)}
                            </p>
                            <p className="text-[11px] font-semibold text-green-600">
                              Abono: S/. {abonoEst.toFixed(2)}
                              {saldoEst > 0 && (
                                <span className="text-amber-600 font-bold ml-1.5">
                                  (Saldo: S/. {saldoEst.toFixed(2)})
                                </span>
                              )}
                            </p>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              {r.comprobante_url && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary" title="Comprobante digital adjunto">
                                  📷 Captura
                                </span>
                              )}
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                r.estado === 'confirmada' ? 'bg-green-500/20 text-green-700' :
                                r.estado === 'completada' ? 'bg-blue-500/20 text-blue-700' :
                                'bg-red-500/20 text-red-700'
                              }`}>
                                {r.estado}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalDetalle(r);
                            }}
                            className="p-2 rounded-lg bg-surface-container-high hover:bg-outline-variant text-on-surface transition-colors cursor-pointer"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODALES */}
      <CrearReservaModal
        isOpen={modalCrearAbierto}
        onClose={cerrarModalCrear}
        onSubmit={handleCrearReserva}
        habitaciones={habitaciones}
        habitacionInicial={habitacionSeleccionada}
      />

      <DetalleReservaModal
        isOpen={modalDetalleAbierto}
        onClose={cerrarModalDetalle}
        reserva={reservaSeleccionada}
        onCheckIn={handleCheckInReserva}
        onCancelar={handleCancelarReserva}
      />

    </div>
  );
};

