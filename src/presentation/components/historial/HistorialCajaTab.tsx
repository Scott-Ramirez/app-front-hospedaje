import React from 'react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  Banknote, 
  Wallet, 
  Eye, 
  Search, 
  X, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface HistorialCajaTabProps {
  totalIngresos: number;
  totalGastos: number;
  saldoCaja: number;
  filtroCaja: string;
  setFiltroCaja: (v: string) => void;
  tipoCajaFiltro: 'TODOS' | 'INGRESO' | 'EGRESO';
  setTipoCajaFiltro: (v: 'TODOS' | 'INGRESO' | 'EGRESO') => void;
  recargarBitacora: () => void;
  loadingBitacora: boolean;
  flujoCajaConsolidado: any[];
  paginaCaja: number;
  setPaginaCaja: React.Dispatch<React.SetStateAction<number>>;
  limitCaja: number;
  setModalDetalle: (v: 'ingresos' | 'egresos' | 'saldo' | null) => void;
  pagos: any[];
  gastos: any[];
  formatFechas: (f: string) => string;
  obtenerIniciales: (n: string) => string;
}

export const HistorialCajaTab: React.FC<HistorialCajaTabProps> = ({
  totalIngresos,
  totalGastos,
  saldoCaja,
  filtroCaja,
  setFiltroCaja,
  tipoCajaFiltro,
  setTipoCajaFiltro,
  recargarBitacora,
  loadingBitacora,
  flujoCajaConsolidado,
  paginaCaja,
  setPaginaCaja,
  limitCaja,
  setModalDetalle,
  pagos,
  gastos,
  formatFechas,
  obtenerIniciales,
}) => {
  // Lógica local de filtrado
  const filtrados = React.useMemo(() => {
    return flujoCajaConsolidado.filter((mov) => {
      // 1. Filtrar por buscador
      const coincideBuscador =
        mov.usuario.toLowerCase().includes(filtroCaja.toLowerCase()) ||
        mov.concepto.toLowerCase().includes(filtroCaja.toLowerCase());
      if (!coincideBuscador) return false;

      // 2. Filtrar por tipo
      if (tipoCajaFiltro === 'INGRESO') return mov.tipo === 'INGRESO';
      if (tipoCajaFiltro === 'EGRESO') return mov.tipo === 'EGRESO';

      return true;
    });
  }, [flujoCajaConsolidado, filtroCaja, tipoCajaFiltro]);

  const paginados = React.useMemo(() => {
    return filtrados.slice((paginaCaja - 1) * limitCaja, paginaCaja * limitCaja);
  }, [filtrados, paginaCaja, limitCaja]);

  const paginasTotalesCaja = Math.ceil(filtrados.length / limitCaja) || 1;

  return (
    <>
      {/* KPI cards — clickeables para ver desglose */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Ingresos */}
        <button
          onClick={() => setModalDetalle('ingresos')}
          className="bg-surface-lowest border border-outline-variant/70 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group cursor-pointer hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-md transition-all text-left"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform">
            <Coins className="h-24 w-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Ingresos Recaudados</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Ver detalle</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 leading-none">S/. {totalIngresos.toFixed(2)}</p>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium">
              {pagos.length} pago{pagos.length !== 1 ? 's' : ''} · Toca para ver desglose
            </p>
          </div>
        </button>

        {/* Card Egresos */}
        <button
          onClick={() => setModalDetalle('egresos')}
          className="bg-surface-lowest border border-outline-variant/70 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group cursor-pointer hover:border-red-500/40 hover:shadow-red-500/10 hover:shadow-md transition-all text-left"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600 group-hover:scale-110 transition-transform">
            <Banknote className="h-24 w-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Gastos (Egresos)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-red-600/70 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Ver detalle</span>
              <div className="p-2 bg-red-500/10 text-red-600 rounded-lg group-hover:bg-red-500/20 transition-colors">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-red-600 leading-none">S/. {totalGastos.toFixed(2)}</p>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium">
              {gastos.length} egreso{gastos.length !== 1 ? 's' : ''} · Toca para ver desglose
            </p>
          </div>
        </button>

        {/* Card Saldo */}
        <button
          onClick={() => setModalDetalle('saldo')}
          className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group cursor-pointer hover:border-primary/40 hover:shadow-primary/10 hover:shadow-md transition-all text-left"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
            <Wallet className="h-24 w-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Saldo Efectivo en Caja</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Ver balance</span>
              <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary/20 transition-colors">
                <Eye className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <p className={`text-3xl font-black leading-none ${saldoCaja >= 0 ? 'text-primary' : 'text-red-600'}`}>
              S/. {saldoCaja.toFixed(2)}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium">Toca para ver balance completo</p>
          </div>
        </button>
      </div>

      {/* Barra de herramientas full-width */}
      <div className="bg-surface-lowest border border-outline-variant/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Buscar por usuario o concepto..."
            value={filtroCaja}
            onChange={(e) => setFiltroCaja(e.target.value)}
            className="w-full bg-surface-container py-2 pl-9 pr-8 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/40 border border-transparent"
          />
          {filtroCaja && (
            <button onClick={() => setFiltroCaja('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtro tipo */}
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/40 select-none shrink-0">
          {(['TODOS', 'INGRESO', 'EGRESO'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoCajaFiltro(t)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                tipoCajaFiltro === t
                  ? t === 'INGRESO'
                    ? 'bg-emerald-500/15 text-emerald-700 shadow-xs'
                    : t === 'EGRESO'
                    ? 'bg-red-500/15 text-red-700 shadow-xs'
                    : 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => recargarBitacora()}
          className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-lg border border-outline-variant/50 flex items-center gap-2 cursor-pointer shrink-0"
        >
          {loadingBitacora ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar
        </button>
      </div>

      {/* Tabla full-width */}
      <div className="bg-surface-lowest border border-outline-variant/90 rounded-xl shadow-xs overflow-hidden relative min-h-[300px]">
        {loadingBitacora && flujoCajaConsolidado.length === 0 && (
          <div className="absolute inset-0 bg-surface-lowest/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-on-surface-variant animate-pulse">Sincronizando flujo de caja...</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6 w-36">Fecha y Hora</th>
                <th className="py-4 px-6 w-36">Empleado</th>
                <th className="py-4 px-6 w-32">Tipo</th>
                <th className="py-4 px-6">Concepto / Referencia</th>
                <th className="py-4 px-6 text-right w-36">Monto Físico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm font-medium">
              {paginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-on-surface-variant/60 font-medium">
                    No hay movimientos de caja registrados bajo estos criterios.
                  </td>
                </tr>
              ) : (
                paginados.map((mov, idx) => {
                  const esIngreso = mov.tipo === 'INGRESO';
                  return (
                    <tr key={`${mov.tipo}-${mov.id}-${idx}`} className="hover:bg-surface-container-low/15 transition-colors group">
                      <td className="py-3.5 px-6 text-center font-bold text-xs text-on-surface-variant/50 bg-surface-container-low/10 group-hover:bg-transparent">
                        {((paginaCaja - 1) * limitCaja) + idx + 1}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-on-surface-variant/80 font-medium whitespace-nowrap">
                        {formatFechas(mov.fecha)}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-5.5 h-5.5 rounded-md bg-surface-container-high text-on-surface-variant font-bold text-[9px] flex items-center justify-center select-none uppercase">
                            {obtenerIniciales(mov.usuario)}
                          </div>
                          <span className="font-bold text-on-surface text-xs truncate max-w-[120px]">{mov.usuario}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          esIngreso 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-700 border-red-500/20'
                        }`}>
                          {esIngreso ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-on-surface font-semibold text-xs leading-relaxed">
                        {mov.concepto}
                      </td>
                      <td className={`py-3.5 px-6 text-right font-black text-sm tabular-nums select-all ${
                        esIngreso ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {esIngreso ? '+' : '−'} S/. {Number(mov.monto).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Caja */}
        {paginasTotalesCaja > 1 && (
          <div className="bg-surface-container-low/40 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant select-none">
            <span className="text-xs font-semibold text-on-surface-variant">
              Registros filtrados: <span className="text-on-surface font-bold">{filtrados.length}</span> movimientos.
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
        )}
      </div>
    </>
  );
};
