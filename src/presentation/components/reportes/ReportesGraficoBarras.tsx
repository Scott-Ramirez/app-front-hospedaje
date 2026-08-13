import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ReportesGraficoBarrasProps {
  selectedYear: number;
  selectedMonth: string;
  labels: string[];
  clientelaData: number[];
  ingresosData: number[];
  egresosData: number[];
}

export const ReportesGraficoBarras: React.FC<ReportesGraficoBarrasProps> = ({
  selectedYear,
  selectedMonth,
  labels,
  clientelaData,
  ingresosData,
  egresosData,
}) => {
  const chartWidth = 500;
  const chartHeight = 200;

  const N = labels.length;

  // Cálculos dinámicos para Chart 1 (Ocupación)
  const paddingLeft1 = 30;
  const paddingRight1 = 10;
  const availableWidth1 = chartWidth - paddingLeft1 - paddingRight1;
  const colWidth1 = availableWidth1 / N;
  const barWidth1 = Math.max(4, Math.min(16, colWidth1 * 0.45));

  // Maximo valor del eje Y para ocupación
  const maxOcupacion = Math.max(...clientelaData, 4);

  // Cálculos dinámicos para Chart 2 (Finanzas)
  const paddingLeft2 = 45;
  const paddingRight2 = 10;
  const availableWidth2 = chartWidth - paddingLeft2 - paddingRight2;
  const doubleColWidth = availableWidth2 / N;
  const subBarWidth = Math.max(2, Math.min(10, doubleColWidth * 0.35));
  const barGap = Math.max(1, Math.min(4, doubleColWidth * 0.1));

  // Maximo financiero para ingresos/egresos
  const maxFinanciero = Math.max(...ingresosData, ...egresosData, 100);

  const formatPeriodoTexto = () => {
    if (selectedMonth === 'ALL') {
      return `Mensuales (Año ${selectedYear})`;
    }
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `Diarios (${nombresMeses[parseInt(selectedMonth, 10)]} ${selectedYear})`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-charts-grid">
      {/* GRÁFICO 1: Ocupación */}
      <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col print-card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-on-surface">Demanda y Check-outs {selectedMonth === 'ALL' ? 'Mensuales' : 'Diarios'}</h3>
        </div>

        <div className="flex-1 min-h-[200px] flex items-center justify-center p-2">
          <svg className="w-full max-w-[500px] mx-auto h-auto aspect-[5/3] chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = chartHeight - (chartHeight * pct);
              const countVal = Math.round(maxOcupacion * pct);
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft1} 
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
                    {countVal}
                  </text>
                </g>
              );
            })}

            {/* Barras reales */}
            {labels.map((label, i) => {
              const val = clientelaData[i] || 0;
              const barHeight = (val / maxOcupacion) * chartHeight;
              const x = paddingLeft1 + (i * colWidth1) + (colWidth1 - barWidth1) / 2;
              const y = chartHeight - barHeight;

              const showLabel = N <= 12 || (i + 1) % 2 !== 0 || i === N - 1;

              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect
                    x={paddingLeft1 + (i * colWidth1)}
                    y="0"
                    width={colWidth1}
                    height={chartHeight}
                    fill="transparent"
                    className="hover:fill-surface-container-high/30 transition-colors"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth1}
                    height={barHeight}
                    rx={N <= 12 ? '4' : '2'}
                    fill="var(--color-primary)"
                    fillOpacity="0.85"
                    className="hover:fill-opacity-100 transition-all duration-300"
                  />
                  {val > 0 && (
                    <text
                      x={x + barWidth1 / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill="currentColor"
                      className={`text-[9px] font-black select-none transition-opacity ${N <= 12 ? 'opacity-100' : 'opacity-0 group-hover/bar:opacity-100'}`}
                    >
                      {val}
                    </text>
                  )}
                  {showLabel && (
                    <text
                      x={paddingLeft1 + (i * colWidth1) + colWidth1 / 2}
                      y={chartHeight + 16}
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-[8px] md:text-[9px] font-bold opacity-80"
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mt-2 font-medium">
          Muestra el volumen de check-outs para identificar qué días u épocas registran mayor ocupación ({formatPeriodoTexto()}).
        </p>
      </div>

      {/* GRÁFICO 2: Incomes vs Expenses */}
      <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col print-card">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-on-surface">Rentabilidad de Caja</h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-500 inline-block" /> Ingresos</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500 inline-block" /> Egresos</div>
          </div>
        </div>

        <div className="flex-1 min-h-[200px] flex items-center justify-center p-2">
          <svg className="w-full max-w-[500px] mx-auto h-auto aspect-[5/3] chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = chartHeight - (chartHeight * pct);
              const countVal = Math.round(maxFinanciero * pct);
              return (
                <g key={idx}>
                  <line x1={paddingLeft2} y1={yVal} x2={chartWidth - 10} y2={yVal} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                  <text x="0" y={yVal + 3} fill="currentColor" className="text-[8px] font-bold opacity-75">S/. {countVal}</text>
                </g>
              );
            })}

            {/* Barras de datos */}
            {labels.map((label, i) => {
              const valIngreso = ingresosData[i] || 0;
              const valEgreso = egresosData[i] || 0;
              const heightIngreso = (valIngreso / maxFinanciero) * chartHeight;
              const heightEgreso = (valEgreso / maxFinanciero) * chartHeight;
              const xBase = paddingLeft2 + (i * doubleColWidth);
              const groupWidth = subBarWidth * 2 + barGap;
              const colOffset = (doubleColWidth - groupWidth) / 2;
              const xIngreso = xBase + colOffset;
              const xEgreso = xBase + colOffset + subBarWidth + barGap;
              const yIngreso = chartHeight - heightIngreso;
              const yEgreso = chartHeight - heightEgreso;
              const showLabel = N <= 12 || (i + 1) % 2 !== 0 || i === N - 1;

              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect x={xBase} y="0" width={doubleColWidth} height={chartHeight} fill="transparent" className="hover:fill-surface-container-high/30 transition-colors" />
                  <rect x={xIngreso} y={yIngreso} width={subBarWidth} height={heightIngreso} rx={N <= 12 ? '2' : '1'} fill="var(--color-primary)" fillOpacity="0.85" className="hover:fill-opacity-100 transition-all duration-300" />
                  <rect x={xEgreso} y={yEgreso} width={subBarWidth} height={heightEgreso} rx={N <= 12 ? '2' : '1'} fill="var(--color-error)" fillOpacity="0.85" className="hover:fill-opacity-100 transition-all duration-300" />
                  
                  {N <= 12 ? (
                    <>
                      {valIngreso > 0 && (
                        <text
                          x={xIngreso + subBarWidth / 2}
                          y={yIngreso - 5}
                          textAnchor="middle"
                          fill="#006b4d"
                          className="text-[8px] font-black select-none"
                        >
                          S/. {valIngreso.toFixed(0)}
                        </text>
                      )}
                      {valEgreso > 0 && (
                        <text
                          x={xEgreso + subBarWidth / 2}
                          y={yEgreso - 5}
                          textAnchor="middle"
                          fill="#ba1a1a"
                          className="text-[8px] font-black select-none"
                        >
                          S/. {valEgreso.toFixed(0)}
                        </text>
                      )}
                    </>
                  ) : (
                    (valIngreso > 0 || valEgreso > 0) && (
                      <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                        <text x={xBase + doubleColWidth / 2} y={Math.min(yIngreso, yEgreso) - 10} textAnchor="middle" fill="currentColor" className="text-[8px] md:text-[9px] font-black">
                          +{valIngreso.toFixed(0)} / -{valEgreso.toFixed(0)}
                        </text>
                      </g>
                    )
                  )}
                  {showLabel && (
                    <text x={xBase + doubleColWidth / 2} y={chartHeight + 16} textAnchor="middle" fill="currentColor" className="text-[8px] md:text-[9px] font-bold opacity-80">{label}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mt-2 font-medium">
          Visualización contable comparativa para evaluar días y periodos más provechosos ({formatPeriodoTexto()}).
        </p>
      </div>
    </div>
  );
};
