import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../data/adapters/api.adapter';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { SolesIcon } from '../components/shared/SolesIcon';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import { ReportesGraficoBarras } from '../components/reportes/ReportesGraficoBarras';
import { ReportesTablaDetalle } from '../components/reportes/ReportesTablaDetalle';

interface HistorialRegistro {
  id: string;
  habitacionNumero: string;
  habitacionTipo?: string;
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

export interface CajaSesionAuditoria {
  id: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_ingresos: number;
  monto_egresos: number;
  monto_real_entregado?: number;
  descuadre?: number;
  estado: string;
  observaciones?: string;
  usuario?: {
    nombre: string;
  };
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

  const [salidas, setSalidas] = useState<HistorialRegistro[]>([]);
  const [pagos, setPagos] = useState<PagoRegistro[]>([]);
  const [gastos, setGastos] = useState<GastoRegistro[]>([]);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [cajaSesiones, setCajaSesiones] = useState<CajaSesionAuditoria[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const fetchReportData = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [resSalidas, resPagos, resGastos, resHabitaciones, resCajaHistorial] = await Promise.all([
        api.get<{ data: HistorialRegistro[] }>('/estancias/historial-salidas', { params: { limite: 10000 } }),
        api.get<PagoRegistro[]>('/caja-sesiones/pagos'),
        api.get<GastoRegistro[]>('/bitacora/gastos'),
        api.get<any[]>('/habitaciones'),
        api.get<{ data: CajaSesionAuditoria[] }>('/caja-sesiones/historial', { params: { limit: 1000 } })
      ]);

      setSalidas(resSalidas.data.data || []);
      setPagos(resPagos.data || []);
      setGastos(resGastos.data || []);
      setHabitaciones(resHabitaciones.data || []);
      setCajaSesiones(resCajaHistorial.data.data || []);
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

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());

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

  const dataFiltrada = useMemo(() => {
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

    const cajaSesionesPeriodo = cajaSesiones.filter(cs => {
      const d = new Date(cs.fecha_apertura);
      const matchesYear = d.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.getMonth() === parseInt(selectedMonth, 10);
      return matchesYear && matchesMonth;
    });

    const totalEstancias = checkOutsPeriodo.length;
    const ingresosTotales = pagosPeriodo.reduce((sum, p) => sum + Number(p.monto), 0);
    const egresosTotales = gastosPeriodo.reduce((sum, g) => sum + Number(g.monto), 0);
    const utilidadNeta = ingresosTotales - egresosTotales;

    let clientelaData: number[] = [];
    let ingresosData: number[] = [];
    let egresosData: number[] = [];
    let labels: string[] = [];

    if (selectedMonth === 'ALL') {
      clientelaData = Array(12).fill(0);
      ingresosData = Array(12).fill(0);
      egresosData = Array(12).fill(0);
      labels = NOMBRES_MESES_ABREV;

      salidas.forEach(s => {
        const d = new Date(s.fechaSalida);
        if (d.getFullYear() === selectedYear) {
          clientelaData[d.getMonth()] += 1;
        }
      });

      pagos.forEach(p => {
        const d = new Date(p.fecha);
        if (d.getFullYear() === selectedYear) {
          ingresosData[d.getMonth()] += Number(p.monto);
        }
      });

      gastos.forEach(g => {
        const d = new Date(g.fecha);
        if (d.getFullYear() === selectedYear) {
          egresosData[d.getMonth()] += Number(g.monto);
        }
      });
    } else {
      const mesIndex = parseInt(selectedMonth, 10);
      const numDias = new Date(selectedYear, mesIndex + 1, 0).getDate();
      clientelaData = Array(numDias).fill(0);
      ingresosData = Array(numDias).fill(0);
      egresosData = Array(numDias).fill(0);
      labels = Array.from({ length: numDias }, (_, i) => (i + 1).toString());

      salidas.forEach(s => {
        const d = new Date(s.fechaSalida);
        if (d.getFullYear() === selectedYear && d.getMonth() === mesIndex) {
          clientelaData[d.getDate() - 1] += 1;
        }
      });

      pagos.forEach(p => {
        const d = new Date(p.fecha);
        if (d.getFullYear() === selectedYear && d.getMonth() === mesIndex) {
          ingresosData[d.getDate() - 1] += Number(p.monto);
        }
      });

      gastos.forEach(g => {
        const d = new Date(g.fecha);
        if (d.getFullYear() === selectedYear && d.getMonth() === mesIndex) {
          egresosData[d.getDate() - 1] += Number(g.monto);
        }
      });
    }

    const numElementos = selectedMonth === 'ALL' ? 12 : clientelaData.length;
    const promedioIngreso = ingresosTotales / numElementos;
    const promedioIngresoTexto = selectedMonth === 'ALL'
      ? `Promedio mensual: S/. ${promedioIngreso.toFixed(2)}`
      : `Promedio diario: S/. ${promedioIngreso.toFixed(2)}`;

    let maxValorIndice = 0;
    let maxValor = 0;
    clientelaData.forEach((val, idx) => {
      if (val > maxValor) {
        maxValor = val;
        maxValorIndice = idx;
      }
    });

    const mayorDemandaTexto = maxValor > 0 
      ? (selectedMonth === 'ALL'
          ? `Mayor demanda: ${NOMBRES_MESES[maxValorIndice]} (${maxValor} check-outs)`
          : `Mayor demanda: Día ${maxValorIndice + 1} (${maxValor} check-outs)`)
      : 'Mayor demanda: Sin registros';

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
      .slice(0, 5);

    const metodosMap: { [metodo: string]: number } = { efectivo: 0, yape: 0, plin: 0, tarjeta: 0, transferencia: 0 };
    pagosPeriodo.forEach(p => {
      const m = (p.metodoPago || '').toLowerCase();
      if (m in metodosMap) {
        metodosMap[m] += Number(p.monto);
      } else {
        metodosMap['efectivo'] += Number(p.monto);
      }
    });

    // ─────────────────────────────────────────────────────────
    // NUEVAS MÉTRICAS: Porcentaje de Ocupación y Por Categoría
    // ─────────────────────────────────────────────────────────
    const totalHabitaciones = habitaciones.length || 1;
    const mesIndexFormula = selectedMonth === 'ALL' ? 0 : parseInt(selectedMonth, 10);
    const numDiasFormula = selectedMonth === 'ALL'
      ? 365
      : new Date(selectedYear, mesIndexFormula + 1, 0).getDate();

    const getDiasEstancia = (entrada: string, salida: string) => {
      const d1 = new Date(new Date(entrada).toLocaleString('en-US', { timeZone: 'America/Lima' }));
      const d2 = new Date(new Date(salida).toLocaleString('en-US', { timeZone: 'America/Lima' }));
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      const diffMs = d2.getTime() - d1.getTime();
      return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    };

    const totalNochesOcupadas = checkOutsPeriodo.reduce((sum, s) => sum + getDiasEstancia(s.fechaEntrada, s.fechaSalida), 0);
    const porcentajeOcupacion = Math.min(100, (totalNochesOcupadas / (numDiasFormula * totalHabitaciones)) * 100);

    const ocupacionTipoMap: { [tipo: string]: number } = {};
    checkOutsPeriodo.forEach(s => {
      const tipo = s.habitacionTipo || 'estandar';
      ocupacionTipoMap[tipo] = (ocupacionTipoMap[tipo] || 0) + 1;
    });

    return {
      totalEstancias,
      ingresosTotales,
      egresosTotales,
      utilidadNeta,
      clientelaData,
      ingresosData,
      egresosData,
      labels,
      promedioIngresoTexto,
      mayorDemandaTexto,
      rankingHuespedes,
      metodosMap,
      porcentajeOcupacion,
      ocupacionTipoMap,
      cajaSesionesPeriodo
    };
  }, [salidas, pagos, gastos, habitaciones, cajaSesiones, selectedYear, selectedMonth]);

  const exportToExcel = () => {
    try {
      const periodoStr = selectedMonth === 'ALL' ? 'Consolidado Anual' : NOMBRES_MESES[parseInt(selectedMonth, 10)];
      
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
      html += `<head><meta charset="utf-8"/>`;
      html += `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte Rayza</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
      html += `<style>`;
      html += `  @page { size: landscape; margin: 0.5in; mso-page-orientation: landscape; }`;
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
      html += `  .table-cell-bold { font-size: 11px; border: 0.5pt solid #cbd5e1; font-weight: bold; padding: 4px; }`;
      html += `</style>`;
      html += `</head><body>`;
 
      html += `<table>`;
      html += `  <tr><td colspan="7" class="title-header">HOSPEDAJE RAYZA - REPORTE CONTABLE ANALÍTICO COMPLETO</td></tr>`;
      html += `  <tr><td class="meta-cell">Periodo:</td><td colspan="2" class="meta-value">${periodoStr} de ${selectedYear}</td><td colspan="4"></td></tr>`;
      html += `  <tr><td class="meta-cell">Fecha Exportación:</td><td colspan="2" class="meta-value">${new Date().toLocaleString()}</td><td colspan="4"></td></tr>`;
      html += `  <tr><td colspan="7"></td></tr>`;
 
      html += `  <tr><td colspan="7" class="section-title">I. INDICADORES CLAVE DE RENDIMIENTO (KPIs)</td></tr>`;
      html += `  <tr>`;
      html += `    <td colspan="2" class="kpi-label">Volumen de Check-outs (Permanencias)</td>`;
      html += `    <td class="kpi-label">Ocupación Promedio</td>`;
      html += `    <td class="kpi-label">Total Ingresos Recaudados</td>`;
      html += `    <td class="kpi-label">Egresos Registrados</td>`;
      html += `    <td colspan="2" class="kpi-label">Utilidad Comercial Neta</td>`;
      html += `  </tr>`;
      html += `  <tr>`;
      html += `    <td colspan="2" class="kpi-value">${dataFiltrada.totalEstancias} estancias</td>`;
      html += `    <td class="kpi-value-primary">${dataFiltrada.porcentajeOcupacion.toFixed(1)}%</td>`;
      html += `    <td class="kpi-value-primary">S/. ${dataFiltrada.ingresosTotales.toFixed(2)}</td>`;
      html += `    <td class="kpi-value-error">S/. ${dataFiltrada.egresosTotales.toFixed(2)}</td>`;
      html += `    <td colspan="2" class="kpi-value-primary" style="${dataFiltrada.utilidadNeta < 0 ? 'color: #ba1a1a;' : ''}">S/. ${dataFiltrada.utilidadNeta.toFixed(2)}</td>`;
      html += `  </tr>`;
      html += `  <tr><td colspan="7"></td></tr>`;

      // SECCIÓN II: RESUMEN DE MÉTODOS DE PAGO Y DEMANDA POR CATEGORÍA
      html += `  <tr><td colspan="7" class="section-title">II. ANÁLISIS DE MERCADO Y CANALES DE PAGO</td></tr>`;
      html += `  <tr>`;
      html += `    <td colspan="3" class="table-header">Preferencias de Tipo de Habitación</td>`;
      html += `    <td></td>`;
      html += `    <td colspan="3" class="table-header">Métodos y Canales de Pago (Flujo)</td>`;
      html += `  </tr>`;
      
      const tiposHab = Object.keys(dataFiltrada.ocupacionTipoMap);
      const metodosPago = Object.keys(dataFiltrada.metodosMap);
      const maxRowsResumen = Math.max(tiposHab.length, metodosPago.length);

      for (let r = 0; r < maxRowsResumen; r++) {
        html += `  <tr>`;
        if (r < tiposHab.length) {
          const tipo = tiposHab[r];
          const cant = dataFiltrada.ocupacionTipoMap[tipo];
          const pct = ((cant / (dataFiltrada.totalEstancias || 1)) * 100).toFixed(0);
          html += `    <td class="table-cell" style="text-transform: capitalize;">${tipo}</td>`;
          html += `    <td class="table-cell-center">${cant} salidas</td>`;
          html += `    <td class="table-cell-right">${pct}%</td>`;
        } else {
          html += `    <td class="table-cell"></td><td class="table-cell"></td><td class="table-cell"></td>`;
        }
        
        html += `    <td></td>`; // Celda separadora

        if (r < metodosPago.length) {
          const metodo = metodosPago[r];
          const monto = dataFiltrada.metodosMap[metodo];
          const pct = ((monto / (dataFiltrada.ingresosTotales || 1)) * 100).toFixed(0);
          html += `    <td class="table-cell" style="text-transform: capitalize;">${metodo}</td>`;
          html += `    <td class="table-cell-right">S/. ${monto.toFixed(2)}</td>`;
          html += `    <td class="table-cell-right">${pct}%</td>`;
        } else {
          html += `    <td class="table-cell"></td><td class="table-cell"></td><td class="table-cell"></td>`;
        }
        html += `  </tr>`;
      }
      html += `  <tr><td colspan="7"></td></tr>`;

      // SECCIÓN III: TOP 5 HUÉSPEDES FRECUENTES
      html += `  <tr><td colspan="7" class="section-title">III. RANKING DE FIDELIZACIÓN - TOP 5 DE HUÉSPEDES</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Posición</td>`;
      html += `    <td colspan="2" class="table-header">Nombre Huésped</td>`;
      html += `    <td class="table-header">DNI / Documento</td>`;
      html += `    <td class="table-header">N° Estancias</td>`;
      html += `    <td colspan="2" class="table-header">Monto Total Invertido</td>`;
      html += `  </tr>`;

      if (dataFiltrada.rankingHuespedes.length === 0) {
        html += `  <tr><td colspan="7" class="table-cell-center" style="color: #64748b;">Sin huéspedes finalizados en el periodo</td></tr>`;
      } else {
        dataFiltrada.rankingHuespedes.forEach((h, idx) => {
          html += `  <tr>`;
          html += `    <td class="table-cell-center" style="font-weight: bold;">${idx + 1}</td>`;
          html += `    <td colspan="2" class="table-cell" style="text-transform: capitalize;">${h.nombre}</td>`;
          html += `    <td class="table-cell-center font-mono">${h.dni}</td>`;
          html += `    <td class="table-cell-center">${h.visitas} visitas</td>`;
          html += `    <td colspan="2" class="table-cell-right" style="font-weight: bold;">S/. ${h.totalGastado.toFixed(2)}</td>`;
          html += `  </tr>`;
        });
      }
      html += `  <tr><td colspan="7"></td></tr>`;
 
      html += `  <tr><td colspan="7" class="section-title">IV. DETALLE DE TRANSACCIONES DE INGRESOS (ABONOS Y PAGOS)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Fecha y Hora</td>`;
      html += `    <td class="table-header">Concepto</td>`;
      html += `    <td class="table-header">Habitación</td>`;
      html += `    <td class="table-header">Huésped</td>`;
      html += `    <td class="table-header">Método de Pago</td>`;
      html += `    <td class="table-header">Recepcionista</td>`;
      html += `    <td class="table-header">Monto (S/.)</td>`;
      html += `  </tr>`;
 
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
 
      if (pagosPeriodo.length === 0) {
        html += `  <tr><td colspan="7" class="table-cell-center" style="color: #64748b;">No hay ingresos registrados en este periodo</td></tr>`;
      } else {
        pagosPeriodo.forEach(p => {
          html += `  <tr>`;
          html += `    <td class="table-cell-center">${new Date(p.fecha).toLocaleString()}</td>`;
          html += `    <td class="table-cell">${p.concepto || 'Abono de Hospedaje'}</td>`;
          html += `    <td class="table-cell-center">Hab. ${p.estanciaId || 'S/N'}</td>`;
          html += `    <td class="table-cell">Registrado</td>`;
          html += `    <td class="table-cell-center" style="text-transform: uppercase;">${p.metodoPago}</td>`;
          html += `    <td class="table-cell">${p.sesionCaja?.usuario?.nombre || 'Recepción'}</td>`;
          html += `    <td class="table-cell-right">S/. ${Number(p.monto).toFixed(2)}</td>`;
          html += `  </tr>`;
        });
        html += `  <tr>`;
        html += `    <td colspan="6" class="table-cell-bold" style="text-align: right; background-color: #f8fafc;">Total Ingresos:</td>`;
        html += `    <td class="table-cell-bold" style="text-align: right; color: #006b4d; background-color: #f8fafc;">S/. ${dataFiltrada.ingresosTotales.toFixed(2)}</td>`;
        html += `  </tr>`;
      }
 
      html += `  <tr><td colspan="7"></td></tr>`;
      html += `  <tr><td colspan="7" class="section-title">V. DETALLE DE EGRESOS Y RETIROS DE CAJA (GASTOS)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Fecha y Hora</td>`;
      html += `    <td colspan="2" class="table-header">Concepto del Gasto</td>`;
      html += `    <td colspan="2" class="table-header">Registrado Por</td>`;
      html += `    <td colspan="2" class="table-header">Monto (S/.)</td>`;
      html += `  </tr>`;
 
      if (gastosPeriodo.length === 0) {
        html += `  <tr><td colspan="7" class="table-cell-center" style="color: #64748b;">No hay egresos registrados en este periodo</td></tr>`;
      } else {
        gastosPeriodo.forEach(g => {
          html += `  <tr>`;
          html += `    <td class="table-cell-center">${new Date(g.fecha).toLocaleString()}</td>`;
          html += `    <td colspan="2" class="table-cell">${g.concepto}</td>`;
          html += `    <td colspan="2" class="table-cell">${g.usuario}</td>`;
          html += `    <td colspan="2" class="table-cell-right" style="color: #ba1a1a;">S/. ${Number(g.monto).toFixed(2)}</td>`;
          html += `  </tr>`;
        });
        html += `  <tr>`;
        html += `    <td colspan="5" class="table-cell-bold" style="text-align: right; background-color: #f8fafc;">Total Gastos:</td>`;
        html += `    <td colspan="2" class="table-cell-bold" style="text-align: right; color: #ba1a1a; background-color: #f8fafc;">S/. ${dataFiltrada.egresosTotales.toFixed(2)}</td>`;
        html += `  </tr>`;
      }
 
      html += `  <tr><td colspan="7"></td></tr>`;
      html += `  <tr><td colspan="7" class="section-title">VI. REGISTRO HISTÓRICO DE SALIDAS (CHECK-OUTS)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Check-In</td>`;
      html += `    <td class="table-header">Check-Out</td>`;
      html += `    <td class="table-header">Huésped</td>`;
      html += `    <td class="table-header">DNI</td>`;
      html += `    <td class="table-header">Habitación</td>`;
      html += `    <td class="table-header">Tarifa Base</td>`;
      html += `    <td class="table-header">Total Cancelado</td>`;
      html += `  </tr>`;
 
      if (checkOutsPeriodo.length === 0) {
        html += `  <tr><td colspan="7" class="table-cell-center" style="color: #64748b;">No hay salidas históricas registradas en este periodo</td></tr>`;
      } else {
        checkOutsPeriodo.forEach(s => {
          html += `  <tr>`;
          html += `    <td class="table-cell-center">${new Date(s.fechaEntrada).toLocaleDateString()}</td>`;
          html += `    <td class="table-cell-center">${new Date(s.fechaSalida).toLocaleDateString()}</td>`;
          html += `    <td class="table-cell">${s.huespedNombre}</td>`;
          html += `    <td class="table-cell-center font-mono">${s.huespedDni}</td>`;
          html += `    <td class="table-cell-center">Hab. ${s.habitacionNumero}</td>`;
          html += `    <td class="table-cell-right">S/. ${Number(s.habitacionPrecioBase).toFixed(2)}</td>`;
          html += `    <td class="table-cell-right" style="font-weight: bold;">S/. ${Number(s.montoTotalPagado).toFixed(2)}</td>`;
          html += `  </tr>`;
        });
      }
 
      html += `  <tr><td colspan="7"></td></tr>`;
      html += `  <tr><td colspan="7" class="section-title">VII. BITÁCORA DE AUDITORÍA CONTABLE DE CAJA (SESIONES)</td></tr>`;
      html += `  <tr>`;
      html += `    <td class="table-header">Fecha Apertura</td>`;
      html += `    <td class="table-header">Fecha Cierre</td>`;
      html += `    <td class="table-header">Recepcionista</td>`;
      html += `    <td class="table-header">Monto Inicial</td>`;
      html += `    <td class="table-header">Ingresos</td>`;
      html += `    <td class="table-header">Egresos</td>`;
      html += `    <td class="table-header">Descuadre</td>`;
      html += `  </tr>`;

      if (dataFiltrada.cajaSesionesPeriodo.length === 0) {
        html += `  <tr><td colspan="7" class="table-cell-center" style="color: #64748b;">No hay sesiones de caja registradas en este periodo</td></tr>`;
      } else {
        dataFiltrada.cajaSesionesPeriodo.forEach(cs => {
          const descuadre = cs.descuadre ?? 0;
          html += `  <tr>`;
          html += `    <td class="table-cell-center">${new Date(cs.fecha_apertura).toLocaleString()}</td>`;
          html += `    <td class="table-cell-center">${cs.fecha_cierre ? new Date(cs.fecha_cierre).toLocaleString() : 'Activa'}</td>`;
          html += `    <td class="table-cell">${cs.usuario?.nombre || 'Desconocido'}</td>`;
          html += `    <td class="table-cell-right">S/. ${Number(cs.monto_inicial || 0).toFixed(2)}</td>`;
          html += `    <td class="table-cell-right" style="color: #006b4d;">S/. ${Number(cs.monto_ingresos || 0).toFixed(2)}</td>`;
          html += `    <td class="table-cell-right" style="color: #ba1a1a;">S/. ${Number(cs.monto_egresos || 0).toFixed(2)}</td>`;
          html += `    <td class="table-cell-center" style="font-weight: bold; ${descuadre !== 0 ? 'color: #ba1a1a;' : 'color: #006b4d;'}">${descuadre === 0 ? 'OK' : 'S/. ' + descuadre.toFixed(2)}</td>`;
          html += `  </tr>`;
        });
      }

      html += `</table>`;
      html += `</body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Reporte_Caja_Rayza_${selectedYear}_${periodoStr}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      AlertAdapter.success('Exportación exitosa', 'El archivo excel con los libros de caja e historial ha sido descargado.');
    } catch (e: any) {
      console.error('Error al exportar reporte Excel:', e);
      AlertAdapter.error('Fallo de Exportación', 'Ocurrió una anomalía al generar el archivo XLS contable.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-on-surface-variant animate-pulse">Sincronizando registros financieros del hospedaje...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto text-on-surface space-y-6 select-none print-container">
      
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5 no-print">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reportes y Estadísticas Contables
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">Consulte ingresos, egresos, rentabilidad y volumen comercial del hospedaje.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Año */}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-surface-lowest text-xs font-bold px-3 py-2 rounded-lg border border-outline-variant outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>Año {y}</option>
            ))}
          </select>

          {/* Selector de Mes */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-surface-lowest text-xs font-bold px-3 py-2 rounded-lg border border-outline-variant outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
          >
            <option value="ALL">Todo el Año</option>
            {NOMBRES_MESES.map((m, idx) => (
              <option key={idx} value={idx.toString()}>{m}</option>
            ))}
          </select>

          {/* Actualizar */}
          <button 
            onClick={() => fetchReportData(true)}
            disabled={refreshing}
            className="p-2 bg-surface hover:bg-surface-container-high rounded-lg border border-outline-variant/65 cursor-pointer disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 text-on-surface-variant ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Exportar */}
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
            title="Exportar a Microsoft Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar XLS</span>
          </button>

          {/* Imprimir */}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-lg border border-outline-variant cursor-pointer transition-all"
            title="Imprimir reporte en PDF / Papel"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex items-start gap-3 no-print">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-red-700 uppercase">Fallo de Carga de Datos</h4>
            <p className="text-xs text-red-600/90 mt-1 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* RENDER EN MODO IMPRESIÓN */}
      <div className="only-print border-b border-outline-variant pb-4 mb-4">
        <h1 className="text-xl font-black text-center text-primary">REPORTES CONTABLES - HOSPEDAJE RAYZA</h1>
        <p className="text-[10px] text-center text-on-surface-variant mt-1 font-medium">
          Periodo: {selectedMonth === 'ALL' ? 'Consolidado Anual' : NOMBRES_MESES[parseInt(selectedMonth, 10)]} de {selectedYear} | Emitido: {new Date().toLocaleString()}
        </p>
      </div>

      {/* KPIs DE CABECERA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print-kpis-grid">
        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs print-kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Check-outs Realizados</span>
            <h3 className="text-2xl font-black">{dataFiltrada.totalEstancias} estancias</h3>
            <p className="text-[9px] text-on-surface-variant font-medium">
              {dataFiltrada.mayorDemandaTexto} · Ocupación: {dataFiltrada.porcentajeOcupacion.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs print-kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ingresos por Estancias</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              <SolesIcon className="h-4.5 w-4.5 inline mr-1" />
              {dataFiltrada.ingresosTotales.toFixed(2)}
            </h3>
            <p className="text-[9px] text-on-surface-variant font-medium">{dataFiltrada.promedioIngresoTexto}</p>
          </div>
        </div>

        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs print-kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Gastos / Retiros Aprobados</span>
            <h3 className="text-2xl font-black text-error">
              <SolesIcon className="h-4.5 w-4.5 inline mr-1" />
              {dataFiltrada.egresosTotales.toFixed(2)}
            </h3>
            <p className="text-[9px] text-on-surface-variant font-medium">Insumos y compras del hospedaje</p>
          </div>
        </div>

        <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-xs print-kpi">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Utilidad Contable Neta</span>
            <h3 className={`text-2xl font-black ${dataFiltrada.utilidadNeta >= 0 ? 'text-primary' : 'text-error'}`}>
              <SolesIcon className="h-4.5 w-4.5 inline mr-1" />
              {dataFiltrada.utilidadNeta.toFixed(2)}
            </h3>
            <p className="text-[9px] text-on-surface-variant">Diferencia neta ingresos vs egresos</p>
          </div>
        </div>
      </div>

      {/* GRÁFICOS ANALÍTICOS */}
      <ReportesGraficoBarras
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        labels={dataFiltrada.labels}
        clientelaData={dataFiltrada.clientelaData}
        ingresosData={dataFiltrada.ingresosData}
        egresosData={dataFiltrada.egresosData}
      />

      {/* LEADERBOARDS & TABLAS */}
      <ReportesTablaDetalle
        dataFiltrada={dataFiltrada}
      />

    </div>
  );
};

export default ReportesPanel;
