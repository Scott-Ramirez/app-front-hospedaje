import React from 'react';
import { 
  Coins, 
  TrendingUp, 
  Search, 
  Calendar, 
  SlidersHorizontal, 
  Loader2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface HistorialCheckoutsTabProps {
  totalLiquidadoSalidas: number;
  loadingHistorial: boolean;
  busqueda: string;
  setBusqueda: (v: string) => void;
  limpiarFiltros: () => void;
  registros: any[];
  paginaActual: number;
  setPaginaActual: React.Dispatch<React.SetStateAction<number>>;
  meta: any;
  formatFechas: (f: string) => string;
  obtenerIniciales: (n: string) => string;
  isSearching: boolean;
  onSelectEstancia?: (id: string) => void;
}

export const HistorialCheckoutsTab: React.FC<HistorialCheckoutsTabProps> = ({
  totalLiquidadoSalidas,
  loadingHistorial,
  busqueda,
  setBusqueda,
  limpiarFiltros,
  registros,
  paginaActual,
  setPaginaActual,
  meta,
  formatFechas,
  obtenerIniciales,
  isSearching,
  onSelectEstancia,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-lowest border border-outline-variant/60 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Liquidado en Check-Outs</p>
            <p className="text-xl font-black text-primary mt-0.5">S/. {totalLiquidadoSalidas.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-surface-lowest border border-outline-variant/60 p-4 rounded-xl flex items-center gap-3 md:col-span-2">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 mt-1 shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
            Este segmento muestra los cobros liquidados directamente tras el Check-Out. Los recepcionistas tienen visibilidad de las habitaciones que han sido liberadas y se encuentran listas para el servicio de limpieza.
          </p>
        </div>
      </div>

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
                    <tr 
                      key={item.id} 
                      onClick={() => onSelectEstancia?.(item.id)}
                      className="hover:bg-surface-container-low/15 transition-colors group cursor-pointer"
                    >
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
  );
};
