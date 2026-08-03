import React, { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import { useBitacora } from '../hooks/useBitacora';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
  SlidersHorizontal,
  Coins,
  Banknote,
  Activity,
  FileText,
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const HistorialSalidas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'salidas' | 'bitacora' | 'caja'>('salidas');
  
  // Hooks de datos
  const {
    registros,
    meta,
    loading: loadingHistorial,
    isSearching,
    busqueda,
    setBusqueda,
    paginaActual,
    setPaginaActual,
    limpiarFiltros
  } = useHistorial();

  const {
    actividades,
    gastos,
    pagos,
    totalGastos,
    loading: loadingBitacora,
    registrarGasto,
    recargarBitacora
  } = useBitacora();

  const { usuario } = useAuth();

  // Formulario de Gasto
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [guardandoGasto, setGuardandoGasto] = useState(false);

  // Filtro de Búsqueda para Bitácora y Gastos
  const [filtroBitacora, setFiltroBitacora] = useState('');
  const [filtroCaja, setFiltroCaja] = useState('');

  // Paginación para Bitácora y Caja
  const [paginaBitacora, setPaginaBitacora] = useState(1);
  const [paginaCaja, setPaginaCaja] = useState(1);
  const limitBitacora = 5;
  const limitCaja = 5;

  // Resetea páginas al buscar
  React.useEffect(() => {
    setPaginaBitacora(1);
  }, [filtroBitacora]);

  React.useEffect(() => {
    setPaginaCaja(1);
  }, [filtroCaja]);



  const obtenerIniciales = (nombre: string) => {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return partes[0][0].toUpperCase();
  };

  const formatFechas = (fechaStr: string) => {
    try {
      const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
      return new Date(fechaStr).toLocaleDateString('es-PE', opciones);
    } catch {
      return fechaStr;
    }
  };

  // Crear estado consolidado de flujo de caja (Ingresos + Egresos combinados)
  const ingresosMapped = pagos.map(p => ({
    id: p.id,
    tipo: 'INGRESO' as const,
    usuario: p.sesionCaja?.usuario?.nombre || 'Sistema',
    monto: Number(p.monto),
    concepto: p.concepto || `Pago de estancia - Habitación ${p.estancia?.habitacion?.numero || 'S/N'} (Huésped: ${p.huesped?.nombre || 'S/N'})`,
    fecha: p.fecha,
  }));

  const egresosMapped = gastos.map(g => ({
    id: g.id,
    tipo: 'EGRESO' as const,
    usuario: g.usuario,
    monto: g.monto,
    concepto: g.concepto,
    fecha: g.fecha,
  }));

  const flujoCajaConsolidado = [...ingresosMapped, ...egresosMapped].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const totalLiquidadoSalidas = registros.reduce((sum, r) => sum + (r.montoTotalPagado || 0), 0);
  const saldoCaja = totalIngresos - totalGastos;

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoMonto || parseFloat(gastoMonto) <= 0 || !gastoConcepto.trim()) return;
    try {
      setGuardandoGasto(true);
      const success = await registrarGasto(parseFloat(gastoMonto), gastoConcepto.trim());
      if (success) {
        setGastoMonto('');
        setGastoConcepto('');
      }
    } finally {
      setGuardandoGasto(false);
    }
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto text-on-surface space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Auditoría, Caja y Actividades</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Registro total de operaciones, flujos de efectivo y bitácora del personal del hospedaje.
          </p>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/50 self-start md:self-auto select-none">
          <button
            onClick={() => setActiveTab('salidas')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'salidas'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Salidas
          </button>
          {usuario?.rol !== 'recepcionista' && (
            <>
              <button
                onClick={() => setActiveTab('bitacora')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'bitacora'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Bitácora
              </button>
              <button
                onClick={() => setActiveTab('caja')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'caja'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                Caja y Egresos
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📋 PESTAÑA 1: SALIDAS DEL HOTEL (CHECK-OUTS) */}
      {/* ======================================================== */}
      {activeTab === 'salidas' && (
        <>
          {/* Bento Card de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-lowest border border-outline-variant/60 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Liquidado en Check-Outs</p>
                <p className="text-xl font-black text-primary mt-0.5">
                  S/. {totalLiquidadoSalidas.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="bg-surface-lowest border border-outline-variant/60 p-4 rounded-xl flex items-center gap-3 md:col-span-2">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 mt-1">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Este segmento muestra los cobros liquidados directamente tras el Check-Out. Los recepcionistas tienen visibilidad auditiva de las habitaciones que han sido liberadas y se encuentran listas para el servicio de limpieza.
              </p>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-lowest p-4 rounded-xl border border-outline-variant/80 shadow-xs">
            <div>
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5">Buscador Huésped</label>
              <div className="relative">
                {loadingHistorial ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                )}
                <input 
                  type="text"
                  placeholder="Buscar por Nombre o DNI..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-surface-container py-1.5 pl-9 pr-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 border border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5">Intervalo Temporal</label>
              <div className="flex items-center justify-between text-sm font-semibold text-on-surface bg-surface-container h-[34px] px-3 rounded-lg border border-transparent">
                <span className="text-on-surface/80">Todos los cierres registrados</span>
                <Calendar className="h-4 w-4 text-primary/70" />
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={limpiarFiltros}
                className="w-full text-on-surface-variant bg-surface-container hover:bg-surface-container-high font-bold text-xs flex items-center justify-center gap-2 h-[34px] rounded-lg border border-outline-variant/40 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Restablecer Criterios
              </button>
            </div>
          </div>

          {/* Tabla de Salidas */}
          <div className="bg-surface-lowest border border-outline-variant/90 rounded-xl shadow-xs overflow-hidden relative min-h-[250px]">
            {loadingHistorial && registros.length === 0 && (
              <div className="absolute inset-0 bg-surface-lowest/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-semibold text-on-surface-variant animate-pulse">Sincronizando salidas...</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                    <th className="py-4 px-6 w-16 text-center">N°</th>
                    <th className="py-4 px-6">Nombre del Huésped</th>
                    <th className="py-4 px-6">Línea de Tiempo (Check-In ➔ Check-Out)</th>
                    <th className="py-4 px-6 text-center">Habitación</th>
                    <th className="py-4 px-6 text-right">Precio Base</th>
                    <th className="py-4 px-6 text-right">Monto Cobrado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 text-sm font-medium transition-opacity duration-200 ${(isSearching || loadingHistorial) ? 'opacity-50' : 'opacity-100'}`}>
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-on-surface-variant/60 font-medium">
                        No existen coincidencias de salidas en el archivo histórico.
                      </td>
                    </tr>
                  ) : (
                    registros.map((item, idx) => {
                      const f1Str = formatFechas(item.fechaEntrada);
                      const f2Str = formatFechas(item.fechaSalida);
                      return (
                        <tr key={item.id} className="hover:bg-surface-container-low/15 transition-colors group">
                          <td className="py-3.5 px-6 text-center font-bold text-xs text-on-surface-variant/60 bg-surface-container-low/20 group-hover:bg-transparent transition-colors">
                            {((paginaActual - 1) * 10) + idx + 1}
                          </td>

                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center shadow-xs uppercase select-none">
                                {obtenerIniciales(item.huespedNombre)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-on-surface font-semibold leading-tight">{item.huespedNombre}</span>
                                <span className="text-[10px] text-on-surface-variant/80 font-medium tracking-wide mt-0.5">DNI: {item.huespedDni}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-xs text-on-surface-variant font-medium">
                            <div className="flex items-center gap-2">
                              <span className="bg-surface-container-high px-2 py-0.5 rounded text-on-surface/80">{f1Str}</span>
                              <span className="text-primary/40 font-bold">➔</span>
                              <span className="bg-primary/5 border border-primary/10 px-2 py-0.5 rounded text-primary font-semibold">{f2Str}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-md bg-surface-container text-xs text-on-surface font-bold tracking-wide border border-outline-variant/30">
                              N° {item.habitacionNumero}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-right font-semibold text-on-surface-variant/90 text-sm tabular-nums">
                            S/. {item.habitacionPrecioBase ? item.habitacionPrecioBase.toFixed(2) : '0.00'}
                          </td>

                          <td className="py-3.5 px-6 text-right font-black text-on-surface text-base tracking-tight tabular-nums">
                            S/. {item.montoTotalPagado.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="bg-surface-container-low/40 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant select-none">
              <span className="text-xs font-semibold text-on-surface-variant">
                Registros totales: <span className="text-on-surface font-bold">{meta.totalRegistros}</span> salidas.
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="text-xs font-bold text-on-surface-variant px-2">
                  Página <span className="text-xs text-on-surface">{meta.paginaActual}</span> de <span className="text-on-surface">{meta.paginasTotales}</span>
                </div>
                
                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, meta.paginasTotales))}
                  disabled={paginaActual === meta.paginasTotales}
                  className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 🕵️ PESTAÑA 2: BITÁCORA DE ACTIVIDADES (AUDITORÍA) */}
      {/* ======================================================== */}
      {activeTab === 'bitacora' && usuario?.rol !== 'recepcionista' && (
        <>
          {/* Buscador de Bitácora */}
          <div className="bg-surface-lowest p-4 rounded-xl border border-outline-variant/80 shadow-xs flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
              <input
                type="text"
                placeholder="Filtrar bitácora por usuario, acción o descripción..."
                value={filtroBitacora}
                onChange={(e) => setFiltroBitacora(e.target.value)}
                className="w-full bg-surface-container py-1.5 pl-9 pr-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 border border-transparent"
              />
            </div>
            <button
              onClick={() => recargarBitacora()}
              className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-lg border border-outline-variant/50 flex items-center gap-2 cursor-pointer"
            >
              {loadingBitacora ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Actualizar
            </button>
          </div>

          {/* Tabla de Bitácora */}
          <div className="bg-surface-lowest border border-outline-variant/90 rounded-xl shadow-xs overflow-hidden relative min-h-[250px]">
            {loadingBitacora && actividades.length === 0 && (
              <div className="absolute inset-0 bg-surface-lowest/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-semibold text-on-surface-variant animate-pulse">Cargando bitácora de auditoría...</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                    <th className="py-4 px-6 w-32">Fecha y Hora</th>
                    <th className="py-4 px-6 w-40">Usuario / Empleado</th>
                    <th className="py-4 px-6 w-44">Acción</th>
                    <th className="py-4 px-6">Descripción del Movimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-sm font-medium">
                  {(() => {
                    const filtradas = actividades.filter(a => 
                      a.usuario.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
                      a.accion.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
                      a.descripcion.toLowerCase().includes(filtroBitacora.toLowerCase())
                    );
                    const paginadas = filtradas.slice((paginaBitacora - 1) * limitBitacora, paginaBitacora * limitBitacora);

                    if (paginadas.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="text-center py-16 text-on-surface-variant/60 font-medium">
                            No hay movimientos registrados en la bitácora de auditoría.
                          </td>
                        </tr>
                      );
                    }

                    return paginadas.map((act) => (
                      <tr key={act.id} className="hover:bg-surface-container-low/15 transition-colors group text-xs md:text-sm">
                        <td className="py-3.5 px-6 text-on-surface-variant/80 font-medium whitespace-nowrap">
                          {formatFechas(act.fecha)}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center select-none">
                              {obtenerIniciales(act.usuario)}
                            </div>
                            <span className="font-bold text-on-surface">{act.usuario}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-surface-container border border-outline-variant/60 text-on-surface-variant">
                            {act.accion}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-on-surface font-semibold">
                          {act.descripcion}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Paginador Bitácora */}
            {(() => {
              const filtradas = actividades.filter(a => 
                a.usuario.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
                a.accion.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
                a.descripcion.toLowerCase().includes(filtroBitacora.toLowerCase())
              );
              const paginasTotalesBitacora = Math.ceil(filtradas.length / limitBitacora) || 1;

              if (paginasTotalesBitacora <= 1) return null;

              return (
                <div className="bg-surface-container-low/40 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant select-none">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Registros filtrados: <span className="text-on-surface font-bold">{filtradas.length}</span> actividades.
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaBitacora((p) => Math.max(p - 1, 1))}
                      disabled={paginaBitacora === 1}
                      className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <div className="text-xs font-bold text-on-surface-variant px-2">
                      Página <span className="text-xs text-on-surface">{paginaBitacora}</span> de <span className="text-on-surface">{paginasTotalesBitacora}</span>
                    </div>
                    
                    <button
                      onClick={() => setPaginaBitacora((p) => Math.min(p + 1, paginasTotalesBitacora))}
                      disabled={paginaBitacora === paginasTotalesBitacora}
                      className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 💰 PESTAÑA 3: CAJA CHICA Y GASTOS (CONTROL ECONÓMICO) */}
      {/* ======================================================== */}
      {activeTab === 'caja' && usuario?.rol !== 'recepcionista' && (
        <>
          {/* Tarjetas Bento de Resumen de Caja */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ingresos */}
            <div className="bg-surface-lowest border border-outline-variant/70 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
                <Coins className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Ingresos Recaudados</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600 leading-none">
                  S/. {totalIngresos.toFixed(2)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Por concepto de adelantos, abonos y cobros de estancias.</p>
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-surface-lowest border border-outline-variant/70 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-error group-hover:scale-110 transition-transform">
                <Banknote className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Gastos (Egresos)</span>
                <div className="p-2 bg-red-500/10 text-red-600 rounded-lg">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-red-600 leading-none">
                  S/. {totalGastos.toFixed(2)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Retiros registrados para compras del hospedaje.</p>
              </div>
            </div>

            {/* Saldo en Caja */}
            <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
                <Wallet className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Saldo Efectivo en Caja</span>
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className={`text-3xl font-black leading-none ${saldoCaja >= 0 ? 'text-primary' : 'text-red-600'}`}>
                  S/. {saldoCaja.toFixed(2)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Flujo disponible en el mostrador del hotel.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Formulario de Registrar Gasto */}
            <div className="bg-surface-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/50 pb-2 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                Anotar Egreso de Caja
              </h3>
              
              <form onSubmit={handleCrearGasto} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Monto a Retirar (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Concepto o Destino de Compra</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ej. Detergente para lavandería, focos de pasillo, etc."
                    value={gastoConcepto}
                    onChange={(e) => setGastoConcepto(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface resize-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoGasto || loadingBitacora}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {guardandoGasto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                  Registrar y Restar de Caja
                </button>
              </form>
            </div>

            {/* Listado Consolidado de Flujo de Caja (Movimientos) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-lowest p-4 rounded-xl border border-outline-variant/80 shadow-xs flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                  <input
                    type="text"
                    placeholder="Buscar movimientos de caja..."
                    value={filtroCaja}
                    onChange={(e) => setFiltroCaja(e.target.value)}
                    className="w-full bg-surface-container py-1.5 pl-9 pr-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 border border-transparent"
                  />
                </div>
              </div>

              <div className="bg-surface-lowest border border-outline-variant/90 rounded-xl shadow-xs overflow-hidden relative min-h-[250px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                        <th className="py-4 px-6 w-32">Fecha y Hora</th>
                        <th className="py-4 px-6 w-28 text-center">Tipo</th>
                        <th className="py-4 px-6 w-32">Usuario</th>
                        <th className="py-4 px-6">Detalle / Concepto</th>
                        <th className="py-4 px-6 text-right w-32">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 text-sm font-medium">
                      {(() => {
                        const filtrado = flujoCajaConsolidado.filter(f => 
                          f.usuario.toLowerCase().includes(filtroCaja.toLowerCase()) ||
                          f.concepto.toLowerCase().includes(filtroCaja.toLowerCase())
                        );
                        const paginados = filtrado.slice((paginaCaja - 1) * limitCaja, paginaCaja * limitCaja);

                        if (paginados.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="text-center py-16 text-on-surface-variant/60 font-medium">
                                No hay transacciones ni egresos registrados en la caja.
                              </td>
                            </tr>
                          );
                        }

                        return paginados.map((mov) => (
                          <tr key={mov.id} className="hover:bg-surface-container-low/15 transition-colors text-xs md:text-sm">
                            <td className="py-3 px-6 text-on-surface-variant/80 font-medium whitespace-nowrap">
                              {formatFechas(mov.fecha)}
                            </td>
                            <td className="py-3 px-6 text-center select-none">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                mov.tipo === 'INGRESO'
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
                              }`}>
                                {mov.tipo}
                              </span>
                            </td>
                            <td className="py-3 px-6 font-bold text-on-surface-variant/80">
                              {mov.usuario}
                            </td>
                            <td className="py-3 px-6 text-on-surface font-semibold">
                              {mov.concepto}
                            </td>
                            <td className={`py-3 px-6 text-right font-black text-sm md:text-base tabular-nums ${
                              mov.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                            }`}>
                              {mov.tipo === 'INGRESO' ? '+' : '-'} S/. {Number(mov.monto).toFixed(2)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Paginador Caja */}
                {(() => {
                  const filtrado = flujoCajaConsolidado.filter(f => 
                    f.usuario.toLowerCase().includes(filtroCaja.toLowerCase()) ||
                    f.concepto.toLowerCase().includes(filtroCaja.toLowerCase())
                  );
                  const paginasTotalesCaja = Math.ceil(filtrado.length / limitCaja) || 1;

                  if (paginasTotalesCaja <= 1) return null;

                  return (
                    <div className="bg-surface-container-low/40 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant select-none">
                      <span className="text-xs font-semibold text-on-surface-variant">
                        Movimientos filtrados: <span className="text-on-surface font-bold">{filtrado.length}</span> registros.
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPaginaCaja((p) => Math.max(p - 1, 1))}
                          disabled={paginaCaja === 1}
                          className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="text-xs font-bold text-on-surface-variant px-2">
                          Página <span className="text-xs text-on-surface">{paginaCaja}</span> de <span className="text-on-surface">{paginasTotalesCaja}</span>
                        </div>
                        
                        <button
                          onClick={() => setPaginaCaja((p) => Math.min(p + 1, paginasTotalesCaja))}
                          disabled={paginaCaja === paginasTotalesCaja}
                          className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};