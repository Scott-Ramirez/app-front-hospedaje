import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../data/adapters/api.adapter';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Coins,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

// Interfaces locales para tipar los datos recibidos
interface HistorialRegistro {
  id: string;
  habitacionNumero: string;
  habitacionPrecioBase: number;
  huespedNombre: string;
  huespedDni: string;
  fechaEntrada: string;
  fechaSalida: string;
  montoTotalPagado: number;
}

interface PagoRegistro {
  id: string;
  monto: number;
  metodoPago: string;
  concepto: string;
  fecha: string;
  estanciaId: string;
  huespedId: string;
  sesionCaja?: {
    usuario?: {
      nombre: string;
    };
  };
}

interface GastoRegistro {
  id: string;
  monto: number;
  concepto: string;
  fecha: string;
  usuario: string;
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_MESES_ABREV = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const ReportesPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de datos brutos
  const [salidas, setSalidas] = useState<HistorialRegistro[]>([]);
  const [pagos, setPagos] = useState<PagoRegistro[]>([]);
  const [gastos, setGastos] = useState<GastoRegistro[]>([]);

  // Estados de filtrado
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' o '0'-'11'

  // Cargar datos consolidados
  const fetchReportData = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      else setRefreshing(true);
      setError(null);

      // Traer historial con límite alto para reportar sobre todo el conjunto de datos
      const [resSalidas, resPagos, resGastos] = await Promise.all([
        api.get<{ data: HistorialRegistro[] }>('/estancias/historial-salidas', { params: { limite: 10000 } }),
        api.get<PagoRegistro[]>('/caja-sesiones/pagos'),
        api.get<GastoRegistro[]>('/bitacora/gastos')
      ]);

      setSalidas(resSalidas.data.data || []);
      setPagos(resPagos.data || []);
      setGastos(resGastos.data || []);
    } catch (err: any) {
      console.error('Error al cargar datos de reportes:', err);
      setError('No se pudo conectar con el servidor central para generar los reportes analíticos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Extraer lista de años únicos presentes en los datos para el selector
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear()); // Año actual garantizado

    salidas.forEach(s => {
      if (s.fechaSalida) yearsSet.add(new Date(s.fechaSalida).getFullYear());
    });
    pagos.forEach(p => {
      if (p.fecha) yearsSet.add(new Date(p.fecha).getFullYear());
    });
    gastos.forEach(g => {
      if (g.fecha) yearsSet.add(new Date(g.fecha).getFullYear());
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [salidas, pagos, gastos]);

  // ========================================================
  // 📊 FILTRADO Y MAPPING DE DATOS DEL PERIODO SELECCIONADO
  // ========================================================
  const dataFiltrada = useMemo(() => {
    // 1. Filtrar transacciones por año y mes seleccionados
    const checkOutsPeriodo = salidas.filter(s => {
      const d = new Date(s.fechaSalida);
      const matchesYear = d.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.getMonth() === parseInt(selectedMonth, 10);
      return matchesYear && matchesMonth;
    });

    const pagosPeriodo = pagos.filter(p => {
      const d = new Date(p.fecha);
      const matchesYear = d.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.getMonth() === parseInt(selectedMonth, 10);
      return matchesYear && matchesMonth;
    });

    const gastosPeriodo = gastos.filter(g => {
      const d = new Date(g.fecha);
      const matchesYear = d.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.getMonth() === parseInt(selectedMonth, 10);
      return matchesYear && matchesMonth;
    });

    // 2. Cálculos generales de KPIs
    const totalEstancias = checkOutsPeriodo.length;
    const ingresosTotales = pagosPeriodo.reduce((sum, p) => sum + Number(p.monto), 0);
    const egresosTotales = gastosPeriodo.reduce((sum, g) => sum + Number(g.monto), 0);
    const utilidadNeta = ingresosTotales - egresosTotales;

    // 3. Distribución mensual de clientela (mes a mes en el año actual)
    const clientelaMensual = Array(12).fill(0);
    salidas.forEach(s => {
      const d = new Date(s.fechaSalida);
      if (d.getFullYear() === selectedYear) {
        clientelaMensual[d.getMonth()] += 1;
      }
    });

    //  distribution mensual financiera (Año seleccionado)
    const ingresosMensuales = Array(12).fill(0);
    const egresosMensuales = Array(12).fill(0);

    pagos.forEach(p => {
      const d = new Date(p.fecha);
      if (d.getFullYear() === selectedYear) {
        ingresosMensuales[d.getMonth()] += Number(p.monto);
      }
    });

    gastos.forEach(g => {
      const d = new Date(g.fecha);
      if (d.getFullYear() === selectedYear) {
        egresosMensuales[d.getMonth()] += Number(g.monto);
      }
    });

    // 4. Ranking de Huéspedes Frecuentes (sobre todo el histórico filtrado por año/mes)
    const huespedMap: { [dni: string]: { nombre: string; dni: string; visitas: number; totalGastado: number } } = {};
    checkOutsPeriodo.forEach(s => {
      if (!s.huespedDni || s.huespedDni === 'N/A') return;
      if (!huespedMap[s.huespedDni]) {
        huespedMap[s.huespedDni] = {
          nombre: s.huespedNombre,
          dni: s.huespedDni,
          visitas: 0,
          totalGastado: 0
        };
      }
      huespedMap[s.huespedDni].visitas += 1;
      huespedMap[s.huespedDni].totalGastado += Number(s.montoTotalPagado);
    });

    const rankingHuespedes = Object.values(huespedMap)
      .sort((a, b) => b.visitas - a.visitas || b.totalGastado - a.totalGastado)
      .slice(0, 5); // TOP 5

    // 5. Estadísticas de Métodos de Pago
    const metodosMap: { [metodo: string]: number } = { efectivo: 0, yape: 0, plin: 0, tarjeta: 0, transferencia: 0 };
    pagosPeriodo.forEach(p => {
      const m = (p.metodoPago || '').toLowerCase();
      if (m in metodosMap) {
        metodosMap[m] += Number(p.monto);
      } else {
        metodosMap['efectivo'] += Number(p.monto); // fallback
      }
    });

    // 6. Estadísticas de Estancia Promedio (en días)
    let totalDias = 0;
    let estanciasValidasCount = 0;
    checkOutsPeriodo.forEach(s => {
      const tEntrada = new Date(s.fechaEntrada).getTime();
      const tSalida = new Date(s.fechaSalida).getTime();
      const diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
      if (diffHrs > 0) {
        // Redondeamos hacia arriba para reflejar días hoteleros cobrados
        const dias = Math.ceil(diffHrs / 24) || 1;
        totalDias += dias;
        estanciasValidasCount += 1;
      }
    });
    const estanciaPromedio = estanciasValidasCount > 0 ? (totalDias / estanciasValidasCount).toFixed(1) : '0.0';

    return {
      totalEstancias,
      ingresosTotales,
      egresosTotales,
      utilidadNeta,
      clientelaMensual,
      ingresosMensuales,
      egresosMensuales,
      rankingHuespedes,
      metodosMap,
      estanciaPromedio
    };
  }, [salidas, pagos, gastos, selectedYear, selectedMonth]);

  // ========================================================
  // 📥 EXPORTAR A EXCEL (CSV COMPATIBLE CON WINDOWS)
  // ========================================================
  const exportToExcel = () => {
    try {
      const periodoStr = selectedMonth === 'ALL' ? 'Consolidado Anual' : NOMBRES_MESES[parseInt(selectedMonth, 10)];
      
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
      html += `<head><meta charset="utf-8"/>`;
      html += `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte Rayza</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
      html += `<style>`;
      html += `  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }`;
      html += `  .title-header { background-color: #004b36; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; height: 35px; }`;
      html += `  .meta-cell { font-size: 11px; color: #475569; padding: 4px; }`;
      html += `  .meta-value { font-size: 11px; font-weight: bold; color: #0f172a; }`;
      html += `  .section-title { background-color: #f1f5f9; color: #0f172a; font-size: 12px; font-weight: bold; height: 28px; border-bottom: 2px solid #cbd5e1; }`;
      html += `  .kpi-label { font-size: 11px; color: #475569; font-weight: bold; background-color: #f8fafc; border: 0.5pt solid #e2e8f0; }`;
      html += `  .kpi-value { font-size: 11px; font-weight: bold; background-color: #f8fafc; border: 0.5pt solid #e2e8f0; }`;
      html += `  .kpi-value-primary { color: #006b4d; font-size: 12px; font-weight: bold; background-color: #f8fafc; border: 0.5pt solid #e2e8f0; }`;
      html += `  .kpi-value-error { color: #ba1a1a; font-size: 12px; font-weight: bold; background-color: #f8fafc; border: 0.5pt solid #e2e8f0; }`;
      html += `  .table-header { background-color: #006b4d; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; height: 26px; }`;
      html += `  .table-cell { font-size: 11px; border: 0.5pt solid #cbd5e1; padding: 4px; }`;
      html += `  .table-cell-center { font-size: 11px; border: 0.5pt solid #cbd5e1; text-align: center; padding: 4px; }`;
      html += `  .table-cell-right { font-size: 11px; border: 0.5pt solid #cbd5e1; text-align: right; padding: 4px; }`;
      html += `  .total-row { font-weight: bold; background-color: #f1f5f9; border-top: 1pt double #94a3b8; height: 24px; }`;
      html += `  .number-format { mso-number-format:"\\S/\\.\\ #\\,\\#\\#0\\.00"; }`;
      html += `</style>`;
      html += `</head><body>`;

      // 1. Cabecera de Título
      html += `<table>`;
      html += `  <tr><td colspan="5" class="title-header">REPORTE DE RENDIMIENTO COMERCIAL - HOSPEDAJE RAYZA</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="meta-cell"><b>Año:</b></td><td class="meta-value">${selectedYear}</td>`;
      html += `    <td class="meta-cell"><b>Periodo:</b></td><td class="meta-value">${periodoStr}</td>`;
      html += `    <td class="meta-cell" style="text-align:right;"><b>Generado:</b> ${new Date().toLocaleDateString()}</td>`;
      html += `  </tr>`;
      html += `</table><br/>`;

      // 2. Bento de KPIs
      html += `<table>`;
      html += `  <tr><td colspan="5" class="section-title">INDICADORES DE RENDIMIENTO CLAVE (KPIs)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="kpi-label">Estancias Totales</td>`;
      html += `    <td class="kpi-label">Ingresos por Estancias</td>`;
      html += `    <td class="kpi-label">Egresos / Gastos</td>`;
      html += `    <td class="kpi-label" colspan="2">Flujo Neto / Utilidad</td>`;
      html += `  </tr>`;
      html += `  <tr>`;
      html += `    <td class="kpi-value">${dataFiltrada.totalEstancias} Huéspedes</td>`;
      html += `    <td class="kpi-value-primary number-format">${dataFiltrada.ingresosTotales}</td>`;
      html += `    <td class="kpi-value-error number-format">${dataFiltrada.egresosTotales}</td>`;
      html += `    <td class="kpi-value-primary number-format" colspan="2">${dataFiltrada.utilidadNeta}</td>`;
      html += `  </tr>`;
      html += `</table><br/>`;

      // 3. Tabla Mensual
      html += `<table>`;
      html += `  <tr><td colspan="5" class="section-title">DISTRIBUCIÓN MENSUAL Y FLUJO ECONÓMICO (AÑO ${selectedYear})</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Mes</td>`;
      html += `    <td class="table-header">Huéspedes Alojados</td>`;
      html += `    <td class="table-header">Ingresos de Caja (S/.)</td>`;
      html += `    <td class="table-header">Egresos de Caja (S/.)</td>`;
      html += `    <td class="table-header">Beneficio Neto (S/.)</td>`;
      html += `  </tr>`;
      
      let sumHuespedes = 0;
      let sumIngresos = 0;
      let sumEgresos = 0;
      
      for (let i = 0; i < 12; i++) {
        const h = dataFiltrada.clientelaMensual[i];
        const ing = dataFiltrada.ingresosMensuales[i];
        const eg = dataFiltrada.egresosMensuales[i];
        const net = ing - eg;

        sumHuespedes += h;
        sumIngresos += ing;
        sumEgresos += eg;

        html += `  <tr>`;
        html += `    <td class="table-cell">${NOMBRES_MESES[i]}</td>`;
        html += `    <td class="table-cell-center">${h}</td>`;
        html += `    <td class="table-cell-right number-format">${ing}</td>`;
        html += `    <td class="table-cell-right number-format">${eg}</td>`;
        html += `    <td class="table-cell-right number-format" style="color:${net >= 0 ? '#006b4d' : '#ba1a1a'}">${net}</td>`;
        html += `  </tr>`;
      }

      // Fila de Totales
      html += `  <tr class="total-row">`;
      html += `    <td class="table-cell">TOTAL ACUMULADO</td>`;
      html += `    <td class="table-cell-center">${sumHuespedes}</td>`;
      html += `    <td class="table-cell-right number-format">${sumIngresos}</td>`;
      html += `    <td class="table-cell-right number-format">${sumEgresos}</td>`;
      html += `    <td class="table-cell-right number-format" style="color:${sumIngresos - sumEgresos >= 0 ? '#006b4d' : '#ba1a1a'}">${sumIngresos - sumEgresos}</td>`;
      html += `  </tr>`;
      html += `</table><br/>`;

      // 4. Ranking de Huéspedes
      html += `<table>`;
      html += `  <tr><td colspan="5" class="section-title">TOP 5 HUÉSPEDES MÁS FRECUENTES (PERIODO FILTRADO)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header" style="width:50px;">Pos</td>`;
      html += `    <td class="table-header">Nombre Huésped</td>`;
      html += `    <td class="table-header">DNI / Documento</td>`;
      html += `    <td class="table-header">Número de Estancias</td>`;
      html += `    <td class="table-header">Inversión Total (S/.)</td>`;
      html += `  </tr>`;

      if (dataFiltrada.rankingHuespedes.length === 0) {
        html += `  <tr><td colspan="5" class="table-cell-center" style="color:#64748b; font-style:italic;">No hay registros para este periodo.</td></tr>`;
      } else {
        dataFiltrada.rankingHuespedes.forEach((g, idx) => {
          html += `  <tr>`;
          html += `    <td class="table-cell-center">${idx + 1}</td>`;
          html += `    <td class="table-cell capitalize">${g.nombre}</td>`;
          html += `    <td class="table-cell-center" style="mso-number-format:'@';">${g.dni}</td>`; // DNI como texto
          html += `    <td class="table-cell-center">${g.visitas} estancias</td>`;
          html += `    <td class="table-cell-right number-format">${g.totalGastado}</td>`;
          html += `  </tr>`;
        });
      }
      html += `</table><br/>`;

      // 5. Métodos de Pago
      html += `<table>`;
      html += `  <tr><td colspan="5" class="section-title">MÉTODOS DE PAGO Y ESTADÍA PROMEDIO</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header" colspan="2">Estadía Promedio</td>`;
      html += `    <td class="table-header" colspan="3">Distribución por Método de Pago</td>`;
      html += `  </tr>`;
      html += `  <tr>`;
      html += `    <td class="table-cell" colspan="2" style="text-align:center; font-size:14px; font-weight:bold; vertical-align:middle;">${dataFiltrada.estanciaPromedio} Noches promedio</td>`;
      html += `    <td class="table-cell" colspan="3">`;
      html += `      <table style="width:100%; border:none;">`;
      
      Object.entries(dataFiltrada.metodosMap).forEach(([metodo, monto]) => {
        const total = dataFiltrada.ingresosTotales || 1;
        const pct = Math.round((monto / total) * 100);
        html += `        <tr>`;
        html += `          <td style="border:none; font-size:10px; font-weight:bold;" class="capitalize">${metodo}</td>`;
        html += `          <td style="border:none; font-size:10px; text-align:right;" class="number-format">${monto}</td>`;
        html += `          <td style="border:none; font-size:10px; font-weight:bold; text-align:right;">(${pct}%)</td>`;
        html += `        </tr>`;
      });
      
      html += `      </table>`;
      html += `    </td>`;
      html += `  </tr>`;
      html += `</table>`;

      html += `</body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte-rayza-${selectedYear}-${selectedMonth}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      AlertAdapter.success('Reporte Exportado', 'El archivo Excel estilizado se descargó correctamente. Abre el archivo y selecciona "Sí" si Excel te muestra un aviso de formato.');
    } catch (err) {
      console.error(err);
      AlertAdapter.error('Error al Exportar', 'No se pudo generar el reporte estilizado de Excel.');
    }
  };

  // Trigger para imprimir / PDF
  const handlePrint = () => {
    window.print();
  };

  // ========================================================
  // 📐 PARÁMETROS PARA DIBUJAR LOS GRÁFICOS SVG
  // ========================================================
  
  // Gráfico 1: Clientela Mensual (Barras Simples)
  const maxClientela = Math.max(...dataFiltrada.clientelaMensual, 1);
  const chartHeight = 160;
  const chartWidth = 500;
  const barPadding = 12;
  const colWidth = chartWidth / 12;
  const barWidth = colWidth - barPadding;

  // Gráfico 2: Ingresos vs Egresos (Barras Dobles Comparativas)
  const maxFinanciero = Math.max(...dataFiltrada.ingresosMensuales, ...dataFiltrada.egresosMensuales, 100);
  const doubleColWidth = chartWidth / 12;
  const subBarWidth = (doubleColWidth - 8) / 2; // Dos barras por mes

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-on-surface-variant animate-pulse">
          Procesando registros de estancias y caja...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-lowest border border-outline-variant p-10 text-center rounded-2xl max-w-md mx-auto space-y-4">
        <span className="text-3xl">⚠️</span>
        <h4 className="font-bold text-sm text-on-surface">Error al Cargar Auditoría</h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        <button 
          onClick={() => fetchReportData()}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reintentar Cargar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print-container select-none">
      
      {/* Estilos CSS Inline específicos para el flujo @media print */}
      <style>{`
        @media print {
          /* Ocultar elementos innecesarios */
          aside, header, nav, button, .no-print, .controls-container {
            display: none !important;
          }
          /* Quitar márgenes de layout y expandir lienzo */
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-container {
            color: #000 !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-kpi-grid {
            display: grid !important;
            grid-template-cols: repeat(4, 1fr) !important;
            gap: 12px !important;
          }
          .print-charts-grid {
            display: grid !important;
            grid-template-cols: 1fr 1fr !important;
            gap: 16px !important;
            margin-top: 16px !important;
            page-break-inside: avoid;
          }
          .print-leaderboard-grid {
            display: grid !important;
            grid-template-cols: 2fr 1fr !important;
            gap: 16px !important;
            margin-top: 16px !important;
            page-break-inside: avoid;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            background: #fff !important;
            box-shadow: none !important;
            padding: 12px !important;
            border-radius: 8px !important;
          }
          .chart-svg {
            width: 100% !important;
            max-height: 180px !important;
            height: auto !important;
          }
        }
      `}</style>

      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5 no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reportes y Estadísticas del Hospedaje
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Análisis estacional de clientela, flujo financiero y comportamiento de huéspedes.
          </p>
        </div>

        {/* BOTONES DE EXPORTACIÓN */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchReportData(true)}
            disabled={refreshing}
            className="p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-transparent shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* CONTROLES DE FILTRADO (Solo visible en pantalla) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-surface-lowest p-4 rounded-xl border border-outline-variant/80 shadow-xs no-print">
        <div>
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5">Seleccionar Año</label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full bg-surface-container border border-outline-variant/40 py-2 px-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr} className="bg-surface text-on-surface">Año {yr}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5">Filtro de Mes</label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 py-2 px-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-primary text-on-surface cursor-pointer"
            >
              <option value="ALL" className="bg-surface text-on-surface">Todos los meses</option>
              {NOMBRES_MESES.map((name, index) => (
                <option key={index} value={index.toString()} className="bg-surface text-on-surface">{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end text-xs text-on-surface-variant font-medium leading-normal pb-2">
          <span>* Los indicadores y leaderboards inferiores se recalculan dinámicamente según la temporalidad seleccionada.</span>
        </div>
      </div>

      {/* TITULO DE REPORTE PARA IMPRESIÓN (Oculto en pantalla) */}
      <div className="hidden print:block border-b border-black pb-3 mb-6">
        <h1 className="text-xl font-bold text-black uppercase tracking-wide">Reporte de Auditoría y Rendimiento Comercial</h1>
        <p className="text-xs text-zinc-600 mt-1">
          Hospedaje RAYZA • Año: <strong>{selectedYear}</strong> • Mes: <strong>{selectedMonth === 'ALL' ? 'Consolidado Anual' : NOMBRES_MESES[parseInt(selectedMonth, 10)]}</strong>
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">Fecha de generación: {new Date().toLocaleString()}</p>
      </div>

      {/* 💳 BENTO DE RESUMEN / INDICADORES CLAVE (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-kpi-grid">
        
        {/* KPI 1: Estancias Totales */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex flex-col justify-between shadow-xs print-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Estancias Totales</span>
            <div className="p-2 bg-primary/10 text-primary rounded-lg no-print">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <h3 className="text-2xl font-black">{dataFiltrada.totalEstancias}</h3>
            <span className="text-xs text-on-surface-variant font-medium">Huéspedes</span>
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2">Check-outs en el periodo</p>
        </div>

        {/* KPI 2: Ingresos Totales */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex flex-col justify-between shadow-xs print-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ingresos Totales</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg no-print">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              S/. {dataFiltrada.ingresosTotales.toFixed(2)}
            </h3>
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2">Ingresos liquidados y abonos</p>
        </div>

        {/* KPI 3: Egresos Totales */}
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex flex-col justify-between shadow-xs print-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Egresos Totales</span>
            <div className="p-2 bg-red-500/10 text-red-600 rounded-lg no-print">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400">
              S/. {dataFiltrada.egresosTotales.toFixed(2)}
            </h3>
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2">Gastos registrados de caja</p>
        </div>

        {/* KPI 4: Utilidad Neta */}
        <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col justify-between shadow-xs print-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Flujo Neto / Utilidad</span>
            <div className="p-2 bg-primary/10 text-primary rounded-lg no-print">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black leading-none ${dataFiltrada.utilidadNeta >= 0 ? 'text-primary' : 'text-red-600'}`}>
              S/. {dataFiltrada.utilidadNeta.toFixed(2)}
            </h3>
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2">Saldo líquido contable</p>
        </div>
      </div>

      {/* 📊 SECCIÓN DE GRÁFICOS SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-charts-grid">
        
        {/* GRÁFICO 1: Clientele Seasonality */}
        <div className="bg-surface-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col print-card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">Clientela y Estacionalidad (Huéspedes por Mes)</h3>
          </div>
          
          <div className="flex-1 min-h-[200px] flex items-center justify-center p-2">
            <svg className="w-full max-w-[500px] mx-auto h-auto aspect-[5/3] chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
              {/* Líneas de cuadrícula horizontal */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const yVal = chartHeight - (chartHeight * pct);
                const countVal = Math.round(maxClientela * pct);
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
                      y={yVal + 4} 
                      fill="currentColor"
                      className="text-[9px] font-bold opacity-75"
                    >
                      {countVal}
                    </text>
                  </g>
                );
              })}

              {/* Barras de datos */}
              {dataFiltrada.clientelaMensual.map((val, i) => {
                const barHeight = (val / maxClientela) * chartHeight;
                const x = 35 + (i * colWidth);
                const y = chartHeight - barHeight;
                return (
                  <g key={i} className="group/bar cursor-pointer">
                    {/* Barra de fondo hover */}
                    <rect
                      x={x - 4}
                      y="0"
                      width={barWidth + 8}
                      height={chartHeight}
                      fill="transparent"
                      className="hover:fill-surface-container-high/30 transition-colors"
                    />
                    {/* Barra real */}
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
                    {/* Cantidad sobre la barra */}
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
                    {/* Etiqueta del Eje X */}
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
            
            {/* Leyenda de Colores */}
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
              {/* Líneas de cuadrícula horizontal */}
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
                      S/.{countVal}
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
                    {/* Barra de fondo hover para todo el mes */}
                    <rect
                      x={xBase - 3}
                      y="0"
                      width={doubleColWidth - 2}
                      height={chartHeight}
                      fill="transparent"
                      className="hover:fill-surface-container-high/30 transition-colors"
                    />

                    {/* Barra Ingresos (Esmeralda) */}
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

                    {/* Barra Egresos (Rojo) */}
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
                    {/* Tooltip con valores al pasar el cursor */}
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
 
                    {/* Etiqueta del Eje X */}
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
            Visualización contable comparativa para evaluar los meses más provechosos comercialmente y auditar las temporadas de alto retiro de gastos.
          </p>
        </div>
      </div>

      {/* 🏆 LEADERBOARDS: HUÉSPEDES FRECUENTES Y MÉTRICAS ADICIONALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-leaderboard-grid">
        
        {/* TABLA: Huespedes Frecuentes (TOP 5) */}
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

        {/* MÉTRICAS DE OPERACIÓN */}
        <div className="bg-surface-lowest rounded-2xl border border-outline-variant p-5 shadow-xs flex flex-col print-card">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">Métodos de Pago y Estadías</h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-around">
            
            {/* KPI Promedio Estadía */}
            <div className="bg-surface-container-low/40 p-4 rounded-xl flex items-center justify-between border border-outline-variant/40">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Estadía Promedio
                </span>
                <p className="text-xs text-on-surface-variant font-medium">Tiempo de permanencia del cliente</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">{dataFiltrada.estanciaPromedio}</span>
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase">Noches</span>
              </div>
            </div>

            {/* Distribución de Métodos de Pago */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Recaudación por Método de Pago</h4>
              
              <div className="space-y-2">
                {Object.entries(dataFiltrada.metodosMap).map(([metodo, monto]) => {
                  const total = dataFiltrada.ingresosTotales || 1;
                  const pct = Math.round((monto / total) * 100);
                  
                  return (
                    <div key={metodo} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-on-surface-variant">
                        <span className="capitalize">{metodo}</span>
                        <span className="font-mono text-on-surface">{pct}% (S/. {monto.toFixed(0)})</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
