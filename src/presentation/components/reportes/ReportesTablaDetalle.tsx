import React from 'react';
import { Users, Coins, BarChart3, BookOpen } from 'lucide-react';
import type { CajaSesionAuditoria } from '../../views/ReportesPanel';

interface RankingHuesped {
  dni: string;
  nombre: string;
  visitas: number;
  totalGastado: number;
}

interface ReportesTablaDetalleProps {
  dataFiltrada: {
    rankingHuespedes: RankingHuesped[];
    metodosMap: { [metodo: string]: number };
    ingresosTotales: number;
    totalEstancias: number;
    ocupacionTipoMap: { [tipo: string]: number };
    cajaSesionesPeriodo: CajaSesionAuditoria[];
  };
}

export const ReportesTablaDetalle: React.FC<ReportesTablaDetalleProps> = ({ dataFiltrada }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print-leaderboard-grid">
      
      {/* Húspedes Frecuentes */}
      <div className="lg:col-span-2 bg-surface-lowest rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col print-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-on-surface">Top 5 de Huéspedes Frecuentes</h3>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                <th className="py-2.5 px-3 text-center w-12">Pos</th>
                <th className="py-2.5 px-3">Nombre Huésped</th>
                <th className="py-2.5 px-3 text-center">DNI / Documento</th>
                <th className="py-2.5 px-3 text-center">N° Visitas</th>
                <th className="py-2.5 px-3 text-right">Inversión Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-medium">
              {dataFiltrada.rankingHuespedes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-on-surface-variant/60 font-medium">
                    No hay registros de estancias finalizadas en este periodo para rankear.
                  </td>
                </tr>
              ) : (
                dataFiltrada.rankingHuespedes.map((h, idx) => (
                  <tr key={h.dni} className="hover:bg-surface-container-low/10 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                        idx === 0 
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/30' 
                          : idx === 1 
                          ? 'bg-zinc-300 text-zinc-900' 
                          : idx === 2 
                          ? 'bg-orange-300 text-orange-950'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-on-surface capitalize">{h.nombre}</td>
                    <td className="py-2.5 px-3 text-center text-on-surface-variant font-mono">{h.dni}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-primary">{h.visitas} estancias</td>
                    <td className="py-2.5 px-3 text-right font-black text-on-surface">S/. {h.totalGastado.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-4 font-medium italic">
          * El ranking de fidelización clasifica a los huéspedes con mayor recurrencia e inversión económica acumulada durante el periodo elegido.
        </p>
      </div>

      {/* Métodos de Pago */}
      <div className="bg-surface-lowest rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between print-card">
        <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/60 pb-3">
          <Coins className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-on-surface">Métodos de Pago</h3>
            <p className="text-[10px] text-on-surface-variant">Porcentaje de recaudación por canal en el periodo</p>
          </div>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-around">
          {Object.entries(dataFiltrada.metodosMap).map(([metodo, monto]) => {
            const total = dataFiltrada.ingresosTotales || 1;
            const pct = Math.round((monto / total) * 100);
            
            const metodosEstilos: { [k: string]: { label: string; color: string } } = {
              efectivo: { label: 'Efectivo', color: 'bg-emerald-500' },
              yape: { label: 'Yape', color: 'bg-purple-600' },
              plin: { label: 'Plin', color: 'bg-cyan-500' },
              tarjeta: { label: 'Tarjeta', color: 'bg-blue-600' },
              transferencia: { label: 'Transferencia', color: 'bg-amber-500' },
            };
            const info = metodosEstilos[metodo] || { label: metodo, color: 'bg-primary' };

            return (
              <div key={metodo} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-on-surface-variant">
                  <span className="capitalize">{info.label}</span>
                  <span className="font-mono text-on-surface font-black">
                    S/. {monto.toFixed(2)} <span className="text-primary ml-1">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`${info.color} h-full rounded-full transition-all duration-500`} 
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ocupación por Categoría */}
      <div className="bg-surface-lowest rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between print-card">
        <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/60 pb-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-on-surface">Demanda por Tipo</h3>
            <p className="text-[10px] text-on-surface-variant">Preferencias de habitaciones del periodo</p>
          </div>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-around">
          {Object.keys(dataFiltrada.ocupacionTipoMap).length === 0 ? (
            <p className="text-center py-6 text-xs text-on-surface-variant/60">Sin registros en este periodo.</p>
          ) : (
            Object.entries(dataFiltrada.ocupacionTipoMap).map(([tipo, cant]) => {
              const total = dataFiltrada.totalEstancias || 1;
              const pct = Math.round((cant / total) * 100);
              
              const tipoEstilos: { [k: string]: { label: string; color: string } } = {
                simple: { label: 'Simple', color: 'bg-primary' },
                matrimonial: { label: 'Matrimonial', color: 'bg-indigo-500' },
                doble: { label: 'Doble', color: 'bg-emerald-500' },
                triple: { label: 'Triple', color: 'bg-orange-500' },
              };
              const info = tipoEstilos[tipo.toLowerCase()] || { label: tipo, color: 'bg-zinc-500' };

              return (
                <div key={tipo} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-on-surface-variant">
                    <span className="capitalize">{info.label}</span>
                    <span className="font-mono text-on-surface font-black">
                      {cant} salidas <span className="text-primary ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`${info.color} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bitácora de Auditoría de Cajas */}
      <div className="lg:col-span-4 bg-surface-lowest rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col print-card mt-2">
        <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/65 pb-3.5">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-sm text-on-surface">Auditoría Contable de Caja</h3>
            <p className="text-[10px] text-on-surface-variant">Historial consolidado de aperturas, cierres y arqueos</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                <th className="py-2.5 px-3">Fecha Apertura / Cierre</th>
                <th className="py-2.5 px-3">Recepcionista</th>
                <th className="py-2.5 px-3 text-right">Inicial</th>
                <th className="py-2.5 px-3 text-right">Ingresos</th>
                <th className="py-2.5 px-3 text-right">Egresos</th>
                <th className="py-2.5 px-3 text-right">Esperado</th>
                <th className="py-2.5 px-3 text-right">Entregado</th>
                <th className="py-2.5 px-3 text-center">Descuadre</th>
                <th className="py-2.5 px-3 w-40">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-medium">
              {dataFiltrada.cajaSesionesPeriodo.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-on-surface-variant/60">
                    No se registran sesiones de caja en este periodo.
                  </td>
                </tr>
              ) : (
                dataFiltrada.cajaSesionesPeriodo.map((sesion) => {
                  const esperado = Number(sesion.monto_inicial || 0) + Number(sesion.monto_ingresos || 0) - Number(sesion.monto_egresos || 0);
                  const entregado = sesion.monto_real_entregado ?? esperado;
                  const descuadre = sesion.descuadre ?? 0;
                  
                  return (
                    <tr key={sesion.id} className="hover:bg-surface-container-low/10 transition-colors">
                      <td className="py-2.5 px-3 text-on-surface leading-tight font-mono text-[11px]">
                        <div>A: {new Date(sesion.fecha_apertura).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        {sesion.fecha_cierre && (
                          <div className="text-on-surface-variant text-[10px]">C: {new Date(sesion.fecha_cierre).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-on-surface capitalize">
                        {sesion.usuario?.nombre || 'Desconocido'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">S/. {Number(sesion.monto_inicial || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-mono">S/. {Number(sesion.monto_ingresos || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500 font-mono">S/. {Number(sesion.monto_egresos || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-on-surface font-mono">S/. {esperado.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {sesion.fecha_cierre ? `S/. ${entregado.toFixed(2)}` : <span className="text-amber-600 font-bold">Activa</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {descuadre === 0 ? (
                          <span className="text-emerald-600 font-bold">OK</span>
                        ) : (
                          <span className="text-red-500 font-bold">{descuadre > 0 ? `+ S/. ${descuadre.toFixed(2)}` : `- S/. ${Math.abs(descuadre).toFixed(2)}`}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant text-[11px] truncate max-w-40" title={sesion.observaciones || ''}>
                        {sesion.observaciones || 'Sin observaciones'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
