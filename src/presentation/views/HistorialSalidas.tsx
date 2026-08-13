import React, { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import { useBitacora } from '../hooks/useBitacora';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Scale,
  History,
  Activity,
  Wallet
} from 'lucide-react';
import { HistorialCheckoutsTab } from '../components/historial/HistorialCheckoutsTab';
import { HistorialBitacoraTab } from '../components/historial/HistorialBitacoraTab';
import { HistorialCajaTab } from '../components/historial/HistorialCajaTab';

export const HistorialSalidas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'salidas' | 'bitacora' | 'caja'>('salidas');
  
  const {
    registros,
    meta,
    loading: loadingHistorial,
    isSearching,
    busqueda,
    setBusqueda,
    paginaActual,
    setPaginaActual,
    limpiarFiltros,
  } = useHistorial();

  const {
    actividades,
    pagos,
    gastos,
    totalGastos,
    loading: loadingBitacora,
    recargarBitacora,
  } = useBitacora();

  const { usuario } = useAuth();

  const [filtroBitacora, setFiltroBitacora] = useState('');
  const [filtroCaja, setFiltroCaja] = useState('');
  const [tipoCajaFiltro, setTipoCajaFiltro] = useState<'TODOS' | 'INGRESO' | 'EGRESO'>('TODOS');

  const [paginaBitacora, setPaginaBitacora] = useState(1);
  const [paginaCaja, setPaginaCaja] = useState(1);
  const limitBitacora = 8;
  const limitCaja = 10;

  const [modalDetalle, setModalDetalle] = useState<'ingresos' | 'egresos' | 'saldo' | null>(null);
  const [filtroModal, setFiltroModal] = useState('');

  React.useEffect(() => { setPaginaBitacora(1); }, [filtroBitacora]);
  React.useEffect(() => { setPaginaCaja(1); }, [filtroCaja, tipoCajaFiltro]);
  React.useEffect(() => { setFiltroModal(''); }, [modalDetalle]);

  const obtenerIniciales = (nombre: string) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatFechas = (fechaStr: string) => {
    try {
      const date = new Date(fechaStr);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch { return fechaStr; }
  };

  const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const totalLiquidadoSalidas = registros.reduce((sum, r) => sum + (r.montoTotalPagado || 0), 0);
  const saldoCaja = totalIngresos - totalGastos;

  const renderModalDetalle = () => {
    if (!modalDetalle) return null;

    let titulo = '';
    let subtitulo = '';
    let colorTotal = '';
    let iconoTotal: React.ReactNode = null;
    let items: { id: string; etiqueta: string; concepto: string; monto: number; signo: '+' | '−' }[] = [];
    let total = 0;

    if (modalDetalle === 'ingresos') {
      titulo = 'Detalle de Ingresos';
      subtitulo = 'Todos los pagos y abonos recaudados en caja';
      colorTotal = 'text-emerald-600';
      iconoTotal = <ArrowUpRight className="h-4 w-4" />;
      items = pagos.map(p => ({
        id: p.id,
        etiqueta: `Hab. ${p.estancia?.habitacion?.numero || 'S/N'}  ·  ${p.huesped?.nombre || 'Huésped'}`,
        concepto: p.concepto || 'Abono / Pago de estancia',
        monto: Number(p.monto),
        signo: '+' as const,
      }));
      total = totalIngresos;
    } else if (modalDetalle === 'egresos') {
      titulo = 'Detalle de Egresos';
      subtitulo = 'Todos los gastos y retiros aprobados';
      colorTotal = 'text-red-600';
      iconoTotal = <ArrowDownRight className="h-4 w-4" />;
      items = gastos.map(g => ({
        id: g.id,
        etiqueta: g.usuario,
        concepto: g.concepto,
        monto: Number(g.monto),
        signo: '−' as const,
      }));
      total = totalGastos;
    } else {
      titulo = 'Resumen de Saldo en Caja';
      subtitulo = 'Ingresos vs. Egresos';
      colorTotal = saldoCaja >= 0 ? 'text-primary' : 'text-red-600';
      iconoTotal = <Scale className="h-4 w-4" />;
      items = [
        ...pagos.map(p => ({
          id: `i-${p.id}`,
          etiqueta: `Hab. ${p.estancia?.habitacion?.numero || 'S/N'}  ·  ${p.huesped?.nombre || 'Huésped'}`,
          concepto: p.concepto || 'Abono / Pago de estancia',
          monto: Number(p.monto),
          signo: '+' as const,
        })),
        ...gastos.map(g => ({
          id: `e-${g.id}`,
          etiqueta: g.usuario,
          concepto: g.concepto,
          monto: Number(g.monto),
          signo: '−' as const,
        })),
      ].sort((a, b) => b.monto - a.monto);
      total = saldoCaja;
    }

    const itemsFiltrados = filtroModal
      ? items.filter(i =>
          i.etiqueta.toLowerCase().includes(filtroModal.toLowerCase()) ||
          i.concepto.toLowerCase().includes(filtroModal.toLowerCase())
        )
      : items;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setModalDetalle(null); }}
      >
        <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between p-5 border-b border-outline-variant/50">
            <div>
              <div className={`flex items-center gap-2 mb-0.5 ${colorTotal}`}>
                {iconoTotal}
                <span className="text-xs font-bold uppercase tracking-wider">{titulo}</span>
              </div>
              <p className="text-sm font-semibold text-on-surface">{subtitulo}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">{items.length} movimientos</p>
            </div>
            <button
              onClick={() => setModalDetalle(null)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {items.length > 4 && (
            <div className="px-5 py-3 border-b border-outline-variant/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={filtroModal}
                  onChange={e => setFiltroModal(e.target.value)}
                  className="w-full bg-surface-container py-1.5 pl-8 pr-3 text-xs rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 border border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {itemsFiltrados.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant/60 text-sm">No hay movimientos.</div>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {itemsFiltrados.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${item.signo === '+' ? 'hover:bg-emerald-500/5' : 'hover:bg-red-500/5'}`}>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-on-surface truncate">{item.etiqueta}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium truncate mt-0.5">{item.concepto}</span>
                    </div>
                    <span className={`text-sm font-black tabular-nums ml-4 shrink-0 ${item.signo === '+' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.signo} S/. {item.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/60 px-5 py-4 bg-surface-container/40 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {modalDetalle === 'saldo' ? 'Saldo neto' : 'Total'}
              </span>
              <span className={`text-xl font-black tabular-nums ${colorTotal}`}>
                {modalDetalle === 'saldo' && total >= 0 ? '+' : modalDetalle === 'saldo' ? '−' : ''} S/. {Math.abs(total).toFixed(2)}
              </span>
            </div>
            {modalDetalle === 'saldo' && (
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-2 font-medium">
                <span>Ingresos: <span className="text-emerald-600 font-bold">S/. {totalIngresos.toFixed(2)}</span></span>
                <span>Egresos: <span className="text-red-600 font-bold">S/. {totalGastos.toFixed(2)}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto text-on-surface space-y-6">
      
      {/* HEADER + TABS SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">Historial de Operaciones</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {activeTab === 'salidas' 
              ? 'Consulte las habitaciones liberadas, check-outs y montos liquidados.' 
              : activeTab === 'bitacora'
              ? 'Bitácora detallada de acciones de personal para auditoría.'
              : 'Flujo de caja neto: registro consolidado de ingresos y egresos.'}
          </p>
        </div>

        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/40 select-none self-start lg:self-center shrink-0">
          <button
            onClick={() => setActiveTab('salidas')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'salidas' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Check-Outs
          </button>
          
          {usuario?.rol !== 'recepcionista' && (
            <>
              <button
                onClick={() => setActiveTab('bitacora')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'bitacora' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Bitácora
              </button>
              <button
                onClick={() => setActiveTab('caja')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'caja' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                Caja y Egresos
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDERIZADO TABS */}
      {activeTab === 'salidas' && (
        <HistorialCheckoutsTab
          totalLiquidadoSalidas={totalLiquidadoSalidas}
          loadingHistorial={loadingHistorial}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          limpiarFiltros={limpiarFiltros}
          registros={registros}
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          meta={meta}
          formatFechas={formatFechas}
          obtenerIniciales={obtenerIniciales}
          isSearching={isSearching}
        />
      )}

      {activeTab === 'bitacora' && usuario?.rol !== 'recepcionista' && (
        <HistorialBitacoraTab
          filtroBitacora={filtroBitacora}
          setFiltroBitacora={setFiltroBitacora}
          recargarBitacora={recargarBitacora}
          loadingBitacora={loadingBitacora}
          actividades={actividades}
          paginaBitacora={paginaBitacora}
          setPaginaBitacora={setPaginaBitacora}
          limitBitacora={limitBitacora}
          formatFechas={formatFechas}
          obtenerIniciales={obtenerIniciales}
        />
      )}

      {activeTab === 'caja' && usuario?.rol !== 'recepcionista' && (
        <HistorialCajaTab
          totalIngresos={totalIngresos}
          totalGastos={totalGastos}
          saldoCaja={saldoCaja}
          filtroCaja={filtroCaja}
          setFiltroCaja={setFiltroCaja}
          tipoCajaFiltro={tipoCajaFiltro}
          setTipoCajaFiltro={setTipoCajaFiltro}
          recargarBitacora={recargarBitacora}
          loadingBitacora={loadingBitacora}
          flujoCajaConsolidado={pagos.map(p => ({
            id: p.id,
            fecha: p.fecha,
            usuario: p.sesionCaja?.usuario?.nombre || 'Recepción',
            tipo: 'INGRESO' as 'INGRESO' | 'EGRESO',
            concepto: p.concepto || `Cobro de estancia Hab. ${p.estancia?.habitacion?.numero || 'S/N'} (${p.huesped?.nombre || 'Huésped'})`,
            monto: Number(p.monto)
          })).concat(gastos.map(g => ({
            id: g.id,
            fecha: g.fecha,
            usuario: g.usuario,
            tipo: 'EGRESO' as 'INGRESO' | 'EGRESO',
            concepto: `Gasto: ${g.concepto}`,
            monto: Number(g.monto)
          }))).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())}
          paginaCaja={paginaCaja}
          setPaginaCaja={setPaginaCaja}
          limitCaja={limitCaja}
          setModalDetalle={setModalDetalle}
          pagos={pagos}
          gastos={gastos}
          formatFechas={formatFechas}
          obtenerIniciales={obtenerIniciales}
        />
      )}

      {/* Modal Desglose */}
      {renderModalDetalle()}

    </div>
  );
};