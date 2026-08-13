import React from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistorialBitacoraTabProps {
  filtroBitacora: string;
  setFiltroBitacora: (v: string) => void;
  recargarBitacora: () => void;
  loadingBitacora: boolean;
  actividades: any[];
  paginaBitacora: number;
  setPaginaBitacora: React.Dispatch<React.SetStateAction<number>>;
  limitBitacora: number;
  formatFechas: (f: string) => string;
  obtenerIniciales: (n: string) => string;
}

export const HistorialBitacoraTab: React.FC<HistorialBitacoraTabProps> = ({
  filtroBitacora,
  setFiltroBitacora,
  recargarBitacora,
  loadingBitacora,
  actividades,
  paginaBitacora,
  setPaginaBitacora,
  limitBitacora,
  formatFechas,
  obtenerIniciales,
}) => {
  const filtradas = React.useMemo(() => {
    return actividades.filter(a =>
      a.usuario.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
      a.accion.toLowerCase().includes(filtroBitacora.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(filtroBitacora.toLowerCase())
    );
  }, [actividades, filtroBitacora]);

  const paginadas = React.useMemo(() => {
    return filtradas.slice((paginaBitacora - 1) * limitBitacora, paginaBitacora * limitBitacora);
  }, [filtradas, paginaBitacora, limitBitacora]);

  const paginasTotalesBitacora = Math.ceil(filtradas.length / limitBitacora) || 1;

  return (
    <>
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
          {loadingBitacora && <Loader2 className="h-3 w-3 animate-spin" />}
          Actualizar
        </button>
      </div>

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
              {paginadas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-on-surface-variant/60 font-medium">
                    No hay movimientos registrados en la bitácora de auditoría.
                  </td>
                </tr>
              ) : (
                paginadas.map((act) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginasTotalesBitacora > 1 && (
          <div className="bg-surface-container-low/40 px-6 py-3.5 flex items-center justify-between border-t border-outline-variant select-none">
            <span className="text-xs font-semibold text-on-surface-variant">
              Registros filtrados: <span className="text-on-surface font-bold">{filtradas.length}</span> actividades.
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaBitacora((p) => Math.max(p - 1, 1))} disabled={paginaBitacora === 1}
                className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-xs font-bold text-on-surface-variant px-2">
                Página <span className="text-xs text-on-surface">{paginaBitacora}</span> de <span className="text-on-surface">{paginasTotalesBitacora}</span>
              </div>
              <button onClick={() => setPaginaBitacora((p) => Math.min(p + 1, paginasTotalesBitacora))} disabled={paginaBitacora === paginasTotalesBitacora}
                className="p-1.5 border border-outline-variant/60 rounded-lg bg-surface-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
