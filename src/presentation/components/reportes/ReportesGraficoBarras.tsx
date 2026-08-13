import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ReportesGraficoBarrasProps {
  selectedYear: number;
  dataFiltrada: {
    clientelaMensual: number[];
    ingresosMensuales: number[];
    egresosMensuales: number[];
  };
  NOMBRES_MESES_ABREV: string[];
}

export const ReportesGraficoBarras: React.FC<ReportesGraficoBarrasProps> = ({
  selectedYear,
  dataFiltrada,
  NOMBRES_MESES_ABREV,
}) => {
  const chartWidth = 500;
  const chartHeight = 200;
  const colWidth = 35;
  const barWidth = 14;

  const doubleColWidth = 36;
  const subBarWidth = 10;

  // Maximo valor del eje Y para ocupación
  const maxOcupacion = Math.max(...dataFiltrada.clientelaMensual, 4);

  // Maximo financiero para ingresos/egresos
  const maxFinanciero = Math.max(
    ...dataFiltrada.ingresosMensuales,
    ...dataFiltrada.egresosMensuales,
    100
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-charts-grid">
      {/* GRÁFICO 1: Ocupación por Mes */}
      <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col print-card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-on-surface">Demanda y Check-outs Mensuales</h3>
        </div>

        <div className="flex-1 min-h-[200px] flex items-center justify-center p-2">
          <svg className="w-full max-w-[500px] mx-auto h-auto aspect-[5/3] chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = chartHeight - (chartHeight * pct);
              const countVal = Math.round(maxOcupacion * pct);
              return (
                <g key={idx}>
                  <line 
                    x1="30" 
                    y1={yVal} 
                    x2={chartWidth - 10} 
                    y2={yVal} 
                    stroke="currentColor" 
                    strokeOpacity="0.08" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x="0" 
                    y={yVal + 3} 
                    fill="currentColor"
                    className="text-[8px] font-bold opacity-75"
                  >
                    {countVal} check
                  </text>
                </g>
              );
            })}

            {/* Barras reales */}
            {Array(12).fill(0).map((_, i) => {
              const val = dataFiltrada.clientelaMensual[i];
              const barHeight = (val / maxOcupacion) * chartHeight;
              const x = 40 + (i * colWidth);
              const y = chartHeight - barHeight;
              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect
                    x={x - 4}
                    y="0"
                    width={barWidth + 8}
                    height={chartHeight}
                    fill="transparent"
                    className="hover:fill-surface-container-high/30 transition-colors"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill="var(--color-primary)"
                    fillOpacity="0.85"
                    className="hover:fill-opacity-100 transition-all duration-300"
                  />
                  {val > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-[10px] font-black select-none opacity-0 group-hover/bar:opacity-100 transition-opacity"
                    >
                      {val}
                    </text>
                  )}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[9px] font-bold opacity-80"
                  >
                    {NOMBRES_MESES_ABREV[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mt-2 font-medium">
          Muestra el volumen de check-outs para identificar qué épocas del año registran mayor ocupación en el hotel (Año {selectedYear}).
        </p>
      </div>

      {/* GRÁFICO 2: Incomes vs Expenses */}
      <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col print-card">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-on-surface">Rentabilidad de Caja (Ingresos vs Egresos)</h3>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block" />
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-red-500 inline-block" />
              <span>Egresos</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[200px] flex items-center justify-center p-2">
          <svg className="w-full max-w-[500px] mx-auto h-auto aspect-[5/3] chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = chartHeight - (chartHeight * pct);
              const countVal = Math.round(maxFinanciero * pct);
              return (
                <g key={idx}>
                  <line 
                    x1="45" 
                    y1={yVal} 
                    x2={chartWidth - 10} 
                    y2={yVal} 
                    stroke="currentColor" 
                    strokeOpacity="0.08" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x="0" 
                    y={yVal + 3} 
                    fill="currentColor"
                    className="text-[8px] font-bold opacity-75"
                  >
                    S/. {countVal}
                  </text>
                </g>
              );
            })}

            {/* Barras de datos */}
            {Array(12).fill(0).map((_, i) => {
              const valIngreso = dataFiltrada.ingresosMensuales[i];
              const valEgreso = dataFiltrada.egresosMensuales[i];

              const heightIngreso = (valIngreso / maxFinanciero) * chartHeight;
              const heightEgreso = (valEgreso / maxFinanciero) * chartHeight;

              const xBase = 50 + (i * doubleColWidth);
              const xIngreso = xBase;
              const xEgreso = xBase + subBarWidth + 4;

              const yIngreso = chartHeight - heightIngreso;
              const yEgreso = chartHeight - heightEgreso;

              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect
                    x={xBase - 3}
                    y="0"
                    width={doubleColWidth - 2}
                    height={chartHeight}
                    fill="transparent"
                    className="hover:fill-surface-container-high/30 transition-colors"
                  />

                  <rect
                    x={xIngreso}
                    y={yIngreso}
                    width={subBarWidth}
                    height={heightIngreso}
                    rx="2"
                    fill="var(--color-primary)"
                    fillOpacity="0.85"
                    className="hover:fill-opacity-100 transition-all duration-300"
                  />

                  <rect
                    x={xEgreso}
                    y={yEgreso}
                    width={subBarWidth}
                    height={heightEgreso}
                    rx="2"
                    fill="var(--color-error)"
                    fillOpacity="0.85"
                    className="hover:fill-opacity-100 transition-all duration-300"
                  />
                  
                  {(valIngreso > 0 || valEgreso > 0) && (
                    <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                      <text
                        x={xBase + doubleColWidth / 2}
                        y={Math.min(yIngreso, yEgreso) - 10}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-[9px] font-black"
                      >
                        +{valIngreso.toFixed(0)} / -{valEgreso.toFixed(0)}
                      </text>
                    </g>
                  )}
 
                  <text
                    x={xBase + doubleColWidth / 2}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[9px] font-bold opacity-80"
                  >
                    {NOMBRES_MESES_ABREV[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mt-2 font-medium">
          Visualización contable comparativa para evaluar los meses más provechosos y auditar egresos (Año {selectedYear}).
        </p>
      </div>
    </div>
  );
};
