import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBitacora } from '../../hooks/useBitacora';
import { 
  DoorOpen, 
  BedDouble, 
  Sparkles, 
  Hotel, 
  AlertCircle, 
  History, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Activity,
  Coins,
  TrendingUp,
  TrendingDown,
  UserCog,
  Settings,
  Calendar,
  FileText,
  ChevronRight,
  CreditCard,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';

interface AdminDashboardViewProps {
  data: any;
  porcentajeOcupacion: number;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ data, porcentajeOcupacion }) => {
  const { resumen, alertas } = data;
  const { actividades, pagos, gastos } = useBitacora();

  // Estados para filtro de período contable
  const [periodoFiltro, setPeriodoFiltro] = useState<'mes_actual' | 'mes_anterior' | 'historico'>('mes_actual');
  
  // Mes actual y mes anterior
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const fechaMesAnterior = new Date(anioActual, mesActual - 1, 1);
  const mesAnterior = fechaMesAnterior.getMonth();
  const anioMesAnterior = fechaMesAnterior.getFullYear();

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const nombreMesActual = `${mesesNombres[mesActual]} ${anioActual}`;
  const nombreMesAnterior = `${mesesNombres[mesAnterior]} ${anioMesAnterior}`;

  // 1. Mes actual
  const pagosMesActual = React.useMemo(() => pagos.filter((p: any) => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }), [pagos, mesActual, anioActual]);

  const gastosMesActual = React.useMemo(() => gastos.filter((g: any) => {
    if (!g.fecha) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }), [gastos, mesActual, anioActual]);

  const ingresosMesActual = React.useMemo(() => pagosMesActual.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagosMesActual]);
  const egresosMesActual = React.useMemo(() => gastosMesActual.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastosMesActual]);
  const balanceMesActual = ingresosMesActual - egresosMesActual;

  // 2. Mes anterior
  const pagosMesAnterior = React.useMemo(() => pagos.filter((p: any) => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === mesAnterior && d.getFullYear() === anioMesAnterior;
  }), [pagos, mesAnterior, anioMesAnterior]);

  const gastosMesAnterior = React.useMemo(() => gastos.filter((g: any) => {
    if (!g.fecha) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesAnterior && d.getFullYear() === anioMesAnterior;
  }), [gastos, mesAnterior, anioMesAnterior]);

  const ingresosMesAnterior = React.useMemo(() => pagosMesAnterior.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagosMesAnterior]);
  const egresosMesAnterior = React.useMemo(() => gastosMesAnterior.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastosMesAnterior]);
  const balanceMesAnterior = ingresosMesAnterior - egresosMesAnterior;

  // 3. Total histórico
  const ingresosHistorico = React.useMemo(() => pagos.reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0), [pagos]);
  const egresosHistorico = React.useMemo(() => gastos.reduce((sum: number, g: any) => sum + Number(g.monto || 0), 0), [gastos]);
  const balanceHistorico = ingresosHistorico - egresosHistorico;

  // Sub-vista de auditoría histórica
  const [vistaDetalleHistorico, setVistaDetalleHistorico] = useState<'meses' | 'cobranzas'>('meses');
  const [busquedaHistorica, setBusquedaHistorica] = useState<string>('');

  // Desglose cronológico mensual del Total Histórico
  const desgloseHistoricoPorMes = React.useMemo(() => {
    const mapaMeses: {
      [clave: string]: {
        anio: number;
        mesIndex: number;
        mesNombre: string;
        ingresos: number;
        egresos: number;
        balance: number;
        numPagos: number;
        numGastos: number;
      };
    } = {};

    pagos.forEach((p: any) => {
      if (!p.fecha) return;
      const d = new Date(p.fecha);
      const y = d.getFullYear();
      const m = d.getMonth();
      const clave = `${y}-${String(m).padStart(2, '0')}`;
      if (!mapaMeses[clave]) {
        mapaMeses[clave] = {
          anio: y,
          mesIndex: m,
          mesNombre: `${mesesNombres[m]} ${y}`,
          ingresos: 0,
          egresos: 0,
          balance: 0,
          numPagos: 0,
          numGastos: 0,
        };
      }
      mapaMeses[clave].ingresos += Number(p.monto || 0);
      mapaMeses[clave].numPagos += 1;
    });

    gastos.forEach((g: any) => {
      if (!g.fecha) return;
      const d = new Date(g.fecha);
      const y = d.getFullYear();
      const m = d.getMonth();
      const clave = `${y}-${String(m).padStart(2, '0')}`;
      if (!mapaMeses[clave]) {
        mapaMeses[clave] = {
          anio: y,
          mesIndex: m,
          mesNombre: `${mesesNombres[m]} ${y}`,
          ingresos: 0,
          egresos: 0,
          balance: 0,
          numPagos: 0,
          numGastos: 0,
        };
      }
      mapaMeses[clave].egresos += Number(g.monto || 0);
      mapaMeses[clave].numGastos += 1;
    });

    return Object.values(mapaMeses)
      .map((item) => ({
        ...item,
        balance: item.ingresos - item.egresos,
      }))
      .sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mesIndex - a.mesIndex;
      });
  }, [pagos, gastos, mesesNombres]);

  // Cobranzas históricas filtradas para el buscador
  const cobranzasHistoricasFiltradas = React.useMemo(() => {
    if (!busquedaHistorica.trim()) return pagos;
    const q = busquedaHistorica.toLowerCase();
    return pagos.filter((p: any) => {
      const huesped = (p.huesped?.nombre || '').toLowerCase();
      const hab = (p.estancia?.habitacion?.numero || '').toLowerCase();
      const concepto = (p.concepto || '').toLowerCase();
      const metodo = (p.metodoPago || '').toLowerCase();
      return huesped.includes(q) || hab.includes(q) || concepto.includes(q) || metodo.includes(q);
    });
  }, [pagos, busquedaHistorica]);

  // Cifras a mostrar según el selector
  const { ingresosMostrados, egresosMostrados, balanceMostrado, etiquetaPeriodo, descripcionSubtexto } = React.useMemo(() => {
    if (periodoFiltro === 'mes_actual') {
      return {
        ingresosMostrados: ingresosMesActual,
        egresosMostrados: egresosMesActual,
        balanceMostrado: balanceMesActual,
        etiquetaPeriodo: `Mes Actual (${nombreMesActual})`,
        descripcionSubtexto: `Generado en ${nombreMesActual} (se reinicia al cerrar el mes)`,
      };
    }
    if (periodoFiltro === 'mes_anterior') {
      return {
        ingresosMostrados: ingresosMesAnterior,
        egresosMostrados: egresosMesAnterior,
        balanceMostrado: balanceMesAnterior,
        etiquetaPeriodo: `Mes Anterior (${nombreMesAnterior})`,
        descripcionSubtexto: `Cierre contable de ${nombreMesAnterior}`,
      };
    }
    return {
      ingresosMostrados: ingresosHistorico,
      egresosMostrados: egresosHistorico,
      balanceMostrado: balanceHistorico,
      etiquetaPeriodo: 'Acumulado Histórico Total',
      descripcionSubtexto: 'Total histórico consolidado de todos los períodos',
    };
  }, [periodoFiltro, ingresosMesActual, egresosMesActual, balanceMesActual, ingresosMesAnterior, egresosMesAnterior, balanceMesAnterior, ingresosHistorico, egresosHistorico, balanceHistorico, nombreMesActual, nombreMesAnterior]);

  const estanciasVencidasAdmin = React.useMemo(() => {
    const lista = alertas.huespedesPorDesocupar || [];
    return lista.filter((item: any) => Boolean(item.estaVencida) && Number(item.montoPendienteAproximado || 0) > 0);
  }, [alertas.huespedesPorDesocupar]);

  const [paginaSalidas, setPaginaSalidas] = useState(1);
  const itemsPorPagina = 4;
  const totalPaginasSalidas = Math.ceil(estanciasVencidasAdmin.length / itemsPorPagina);
  const salidasPaginadas = estanciasVencidasAdmin.slice(
    (paginaSalidas - 1) * itemsPorPagina,
    paginaSalidas * itemsPorPagina
  );
  // ─────────────────────────────────────────────────────────────────────────────
  // IMPRESIÓN Y EXPORTACIÓN DEL TOTAL HISTÓRICO
  // ─────────────────────────────────────────────────────────────────────────────
  const imprimirPDFHistorico = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      AlertAdapter.error('Error', 'Permita las ventanas emergentes para generar el reporte de impresión.');
      return;
    }

    const mapaMetodos: { [k: string]: { total: number; conteo: number } } = {
      efectivo: { total: 0, conteo: 0 },
      yape: { total: 0, conteo: 0 },
      plin: { total: 0, conteo: 0 },
      transferencia: { total: 0, conteo: 0 },
      tarjeta: { total: 0, conteo: 0 },
    };

    pagos.forEach((p: any) => {
      const m = (p.metodoPago || 'efectivo').toLowerCase();
      const monto = Number(p.monto || 0);
      if (m in mapaMetodos) {
        mapaMetodos[m].total += monto;
        mapaMetodos[m].conteo += 1;
      } else {
        mapaMetodos['efectivo'].total += monto;
        mapaMetodos['efectivo'].conteo += 1;
      }
    });

    const totalEfectivoHist = mapaMetodos['efectivo'].total;
    const totalDigitalHist =
      mapaMetodos['yape'].total +
      mapaMetodos['plin'].total +
      mapaMetodos['transferencia'].total +
      mapaMetodos['tarjeta'].total;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Auditoría y Balance Total Histórico - Hospedaje Rayza</title>
        <style>
          @page { size: A4; margin: 12mm 12mm 12mm 12mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; font-size: 10px; }
          .header { border-bottom: 2px solid #006b4d; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; color: #006b4d; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 2px 0 0; color: #64748b; font-size: 10px; }
          .badge-periodo { background: #e6f4ea; color: #006b4d; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 11px; border: 1px solid #b7e1cd; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
          .kpi-card.highlight { background: #d1fae5; border-color: #10b981; }
          .kpi-card .label { font-size: 8px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px; }
          .kpi-card .value { font-size: 13.5px; font-weight: 900; color: #0f172a; }
          .kpi-card.highlight .value { color: #047857; font-size: 15px; }

          .desglose-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 9.5px; }
          
          h2 { font-size: 10.5px; font-weight: bold; color: #006b4d; text-transform: uppercase; margin: 12px 0 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; text-align: left; padding: 4px 6px; border: 1px solid #cbd5e1; }
          td { padding: 4px 6px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fafafa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          
          .badge-m { padding: 1px 4px; border-radius: 4px; font-weight: bold; font-size: 8px; }
          .b-yape { background: #f3e8ff; color: #7e22ce; }
          .b-plin { background: #e0f2fe; color: #0284c7; }
          .b-efectivo { background: #dcfce7; color: #15803d; }
          .b-transf { background: #dbeafe; color: #1d4ed8; }
          .b-tarjeta { background: #fef3c7; color: #b45309; }

          .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; page-break-inside: avoid; }
          .firma-box { border-top: 1px solid #334155; text-align: center; padding-top: 4px; }
          .firma-box p { margin: 2px 0; font-size: 9px; color: #475569; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Hospedaje Rayza</h1>
            <p>Auditoría Ejecutiva y Desglose del Total Histórico Acumulado</p>
          </div>
          <div>
            <div class="badge-periodo">HISTÓRICO ACUMULADO CONSOLIDADO</div>
          </div>
        </div>

        <!-- RESUMEN EN TARJETAS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">Ingresos Históricos</div>
            <div class="value" style="color: #006b4d;">S/. ${ingresosHistorico.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Egresos / Gastos Totales</div>
            <div class="value" style="color: #ba1a1a;">S/. ${egresosHistorico.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Total Operaciones Cobradas</div>
            <div class="value" style="color: #1e293b;">${pagos.length} cobros</div>
          </div>
          <div class="kpi-card highlight">
            <div class="label">Balance Neto Acumulado</div>
            <div class="value">S/. ${balanceHistorico.toFixed(2)}</div>
          </div>
        </div>

        <!-- CONCILIACIÓN DE FONDOS -->
        <div class="desglose-box">
          <div>💵 <b>Total Efectivo Acumulado:</b> S/. ${totalEfectivoHist.toFixed(2)} (${mapaMetodos['efectivo'].conteo} cobros)</div>
          <div>📱 <b>Canales Digitales Totales:</b> S/. ${totalDigitalHist.toFixed(2)} (Yape: S/. ${mapaMetodos['yape'].total.toFixed(2)} · Plin: S/. ${mapaMetodos['plin'].total.toFixed(2)} · Bancos: S/. ${mapaMetodos['transferencia'].total.toFixed(2)})</div>
        </div>

        <!-- SECCIÓN 1: RESUMEN MENSUAL CONSOLIDADO -->
        <h2>1. Consolidado Cronológico por Meses (${desgloseHistoricoPorMes.length} Períodos)</h2>
        <table>
          <thead>
            <tr>
              <th>Período / Mes</th>
              <th class="text-center" style="width: 70px;">N° Cobros</th>
              <th class="text-right" style="width: 100px;">Ingresos por Estancias</th>
              <th class="text-right" style="width: 100px;">Gastos Deducidos</th>
              <th class="text-right" style="width: 100px;">Balance Mensual</th>
            </tr>
          </thead>
          <tbody>
            ${desgloseHistoricoPorMes.map((m) => `
              <tr>
                <td class="font-bold">${m.mesNombre}</td>
                <td class="text-center font-mono">${m.numPagos} pagos</td>
                <td class="text-right font-bold" style="color: #006b4d;">S/. ${m.ingresos.toFixed(2)}</td>
                <td class="text-right font-bold" style="color: #ba1a1a;">S/. ${m.egresos.toFixed(2)}</td>
                <td class="text-right font-bold" style="color: ${m.balance >= 0 ? '#006b4d' : '#ba1a1a'};">S/. ${m.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #e6f4ea; font-weight: bold;">
              <td>TOTAL HISTÓRICO CONSOLIDADO:</td>
              <td class="text-center font-mono">${pagos.length} cobros</td>
              <td class="text-right" style="color: #006b4d;">S/. ${ingresosHistorico.toFixed(2)}</td>
              <td class="text-right" style="color: #ba1a1a;">S/. ${egresosHistorico.toFixed(2)}</td>
              <td class="text-right" style="color: #006b4d; font-size: 10.5px;">S/. ${balanceHistorico.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- SECCIÓN 2: DETALLE COMPLETO DE TODAS LAS COBRANZAS HISTÓRICAS -->
        <h2>2. Detalle de Todas las Transacciones y Cobranzas Registradas (${pagos.length} Registros)</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 75px;">Fecha y Hora</th>
              <th class="text-center" style="width: 65px;">Método</th>
              <th>Huésped</th>
              <th class="text-center" style="width: 60px;">Habitación</th>
              <th>Concepto / Motivo</th>
              <th style="width: 80px;">Cajero / Resp.</th>
              <th class="text-right" style="width: 75px;">Monto Cobrado</th>
            </tr>
          </thead>
          <tbody>
            ${pagos.map((p: any) => {
              const m = (p.metodoPago || 'efectivo').toLowerCase();
              const badgeClass = m === 'yape' ? 'b-yape' : (m === 'plin' ? 'b-plin' : (m === 'efectivo' ? 'b-efectivo' : (m === 'tarjeta' ? 'b-tarjeta' : 'b-transf')));
              const fechaStr = new Date(p.fecha).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              const habitacionStr = p.estancia?.habitacion?.numero ? `Hab. ${p.estancia.habitacion.numero}` : 'S/N';
              const cajero = p.sesionCaja?.usuario?.nombre || 'Recepción';

              return `
                <tr>
                  <td class="text-center font-mono" style="font-size: 8px;">${fechaStr}</td>
                  <td class="text-center"><span class="badge-m ${badgeClass}">${m.toUpperCase()}</span></td>
                  <td style="text-transform: capitalize; font-weight: 600;">${p.huesped?.nombre || 'Particular / Directo'}</td>
                  <td class="text-center font-bold">${habitacionStr}</td>
                  <td style="color: #475569;">${p.concepto || 'Abono'}</td>
                  <td style="font-size: 8px; color: #64748b;">${cajero}</td>
                  <td class="text-right font-bold" style="color: #006b4d;">S/. ${Number(p.monto || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background: #e6f4ea; font-weight: bold;">
              <td colspan="6" class="text-right">TOTAL GENERAL COBRADO HISTÓRICO:</td>
              <td class="text-right" style="color: #006b4d; font-size: 10px;">S/. ${ingresosHistorico.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- FIRMAS -->
        <div class="firmas">
          <div class="firma-box">
            <p><b>ADMINISTRACIÓN / DUEÑO</b></p>
            <p>Firma y Sello de Conformidad</p>
          </div>
          <div class="firma-box">
            <p><b>AUDITORÍA / CONTABILIDAD</b></p>
            <p>Fecha de Auditoría: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportarExcelHistorico = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #1e293b; }
          .title-banner { background-color: #006b4d; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 35px; vertical-align: middle; }
          .subtitle { color: #64748b; font-size: 10pt; text-align: center; }
          .sec-header { background-color: #0f766e; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; }
          .table-th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left; border: 1px solid #cbd5e1; padding: 6px; }
          .table-th-center { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 6px; }
          .table-th-right { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: right; border: 1px solid #cbd5e1; padding: 6px; }
          td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; }
          .num { text-align: right; mso-number-format: '"S/."\\ #\\,##0\\.00'; font-variant-numeric: tabular-nums; }
          .center { text-align: center; }
          .badge-yape { background-color: #f3e8ff; color: #7e22ce; font-weight: bold; text-align: center; }
          .badge-plin { background-color: #e0f2fe; color: #0284c7; font-weight: bold; text-align: center; }
          .badge-efectivo { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
          .badge-transf { background-color: #dbeafe; color: #1d4ed8; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="title-banner">HOSPEDAJE RAYZA — AUDITORÍA Y TOTAL HISTÓRICO</td></tr>
          <tr><td colspan="7" class="subtitle">Reporte Consolidado Acumulado | Generado: ${new Date().toLocaleString()}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr><td colspan="7" class="sec-header">I. RESUMEN FINANCIERO HISTÓRICO</td></tr>
          <tr><td colspan="4">Total Ingresos Históricos Acumulados:</td><td colspan="3" class="num" style="color:#047857; font-weight:bold;">S/. ${ingresosHistorico.toFixed(2)}</td></tr>
          <tr><td colspan="4">Total Egresos / Gastos Históricos:</td><td colspan="3" class="num" style="color:#b91c1c; font-weight:bold;">S/. ${egresosHistorico.toFixed(2)}</td></tr>
          <tr style="background-color:#d1fae5; font-weight:bold;"><td colspan="4">UTILIDAD / BALANCE NETO HISTÓRICO:</td><td colspan="3" class="num" style="color:#065f46; font-size:12pt;">S/. ${balanceHistorico.toFixed(2)}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr><td colspan="7" class="sec-header">II. CONSOLIDADO POR MESES</td></tr>
          <tr>
            <td class="table-th" colspan="2">Período / Mes</td>
            <td class="table-th-center">N° Cobros</td>
            <td class="table-th-right" colspan="2">Ingresos (S/.)</td>
            <td class="table-th-right">Gastos (S/.)</td>
            <td class="table-th-right">Balance Neto (S/.)</td>
          </tr>
          ${desgloseHistoricoPorMes.map((m) => `
            <tr>
              <td colspan="2"><b>${m.mesNombre}</b></td>
              <td class="center">${m.numPagos} pagos</td>
              <td colspan="2" class="num" style="color:#047857;">S/. ${m.ingresos.toFixed(2)}</td>
              <td class="num" style="color:#b91c1c;">S/. ${m.egresos.toFixed(2)}</td>
              <td class="num" style="font-weight:bold; color:${m.balance >= 0 ? '#047857' : '#b91c1c'};">S/. ${m.balance.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td colspan="2">TOTAL CONSOLIDADO:</td>
            <td class="center">${pagos.length} pagos</td>
            <td colspan="2" class="num" style="color:#047857;">S/. ${ingresosHistorico.toFixed(2)}</td>
            <td class="num" style="color:#b91c1c;">S/. ${egresosHistorico.toFixed(2)}</td>
            <td class="num" style="color:#047857;">S/. ${balanceHistorico.toFixed(2)}</td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr><td colspan="7" class="sec-header">III. HISTORIAL DE TODAS LAS COBRANZAS (${pagos.length} TRANSACCIONES)</td></tr>
          <tr>
            <td class="table-th-center">Fecha y Hora</td>
            <td class="table-th-center">Método</td>
            <td class="table-th">Huésped</td>
            <td class="table-th-center">Habitación</td>
            <td class="table-th">Concepto</td>
            <td class="table-th">Cajero / Resp.</td>
            <td class="table-th-right">Monto (S/.)</td>
          </tr>
          ${pagos.map((p: any) => {
            const m = (p.metodoPago || 'efectivo').toUpperCase();
            const badgeClass = m === 'YAPE' ? 'badge-yape' : (m === 'PLIN' ? 'badge-plin' : (m === 'EFECTIVO' ? 'badge-efectivo' : 'badge-transf'));
            const habitacionStr = p.estancia?.habitacion?.numero ? `Hab. ${p.estancia.habitacion.numero}` : 'S/N';
            const cajero = p.sesionCaja?.usuario?.nombre || 'Recepción';
            return `
              <tr>
                <td class="center">${new Date(p.fecha).toLocaleString()}</td>
                <td class="${badgeClass}">${m}</td>
                <td style="text-transform:capitalize;">${p.huesped?.nombre || 'Particular / Directo'}</td>
                <td class="center">${habitacionStr}</td>
                <td>${p.concepto || 'Abono'}</td>
                <td>${cajero}</td>
                <td class="num" style="font-weight:bold; color:#047857;">S/. ${Number(p.monto || 0).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td colspan="6" style="text-align:right;">TOTAL GENERAL COBRADO:</td>
            <td class="num" style="color:#047857; font-size:11pt;">S/. ${ingresosHistorico.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Total_Historico_Hospedaje_Rayza.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    AlertAdapter.toast('Total Histórico exportado a Excel', 'success');
  };

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: BENTO FINANCIERO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Resumen de Caja y Flujo de Fondos
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Mostrando: <span className="font-bold text-primary">{etiquetaPeriodo}</span>
            </p>
          </div>

          {/* Selector de Período */}
          <div className="flex items-center bg-surface-lowest border border-outline-variant p-1 rounded-xl gap-1 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setPeriodoFiltro('mes_actual')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'mes_actual'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Mes Actual
            </button>
            <button
              type="button"
              onClick={() => setPeriodoFiltro('mes_anterior')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'mes_anterior'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={() => setPeriodoFiltro('historico')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                periodoFiltro === 'historico'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              Total Histórico
            </button>
          </div>
        </div>

        {/* Tarjetas Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-green-500/5 group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Ingresos por Estancias {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Totales'}
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                S/. {ingresosMostrados.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant">{descripcionSubtexto}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 relative z-10">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-error/5 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Egresos / Gastos {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Totales'}
              </span>
              <h3 className="text-2xl font-black text-error">
                S/. {egresosMostrados.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant font-medium">Registrados en la bitácora de caja</p>
            </div>
            <div className="p-3 bg-error/10 text-error rounded-xl shrink-0 relative z-10">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] text-primary/5 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-28 w-28" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Flujo Neto en Caja {periodoFiltro === 'mes_actual' ? `(${mesesNombres[mesActual]})` : periodoFiltro === 'mes_anterior' ? `(${mesesNombres[mesAnterior]})` : 'Total'}
              </span>
              <h3 className={`text-2xl font-black ${balanceMostrado >= 0 ? 'text-primary' : 'text-error'}`}>
                S/. {balanceMostrado.toFixed(2)}
              </h3>
              <p className="text-[9px] text-on-surface-variant">Caja disponible neta calculada</p>
            </div>
            <div className={`p-3 rounded-xl shrink-0 relative z-10 ${balanceMostrado >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Barra comparativa mensual */}
        <div className="bg-surface-lowest border border-outline-variant px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant shadow-xs">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold text-[11px] uppercase tracking-wider">Comparador Rápido:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className={periodoFiltro === 'mes_actual' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              📅 Mes Actual ({mesesNombres[mesActual]}): <strong className={balanceMesActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}>S/. {balanceMesActual.toFixed(2)}</strong>
            </span>
            <span className="text-outline-variant">|</span>
            <span className={periodoFiltro === 'mes_anterior' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              ⏮️ Mes Anterior ({mesesNombres[mesAnterior]}): <strong className={balanceMesAnterior >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}>S/. {balanceMesAnterior.toFixed(2)}</strong>
            </span>
            <span className="text-outline-variant">|</span>
            <span className={periodoFiltro === 'historico' ? 'font-bold text-primary underline underline-offset-4' : ''}>
              🌐 Histórico Total: <strong className={balanceHistorico >= 0 ? 'text-primary' : 'text-error'}>S/. {balanceHistorico.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* DESGLOSE DETALLADO DEL TOTAL HISTÓRICO */}
        {periodoFiltro === 'historico' && (
          <div className="bg-surface-lowest border-2 border-primary/30 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
            {/* Header con tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-black text-on-surface">
                    Desglose Detallado del Total Histórico (S/. {ingresosHistorico.toFixed(2)})
                  </h4>
                </div>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  Consolidado cronológico de ingresos por cobranzas y egresos registrados en el hospedaje
                </p>
              </div>

              {/* Acciones y Selector de sub-vista */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de sub-vista */}
                <div className="flex items-center gap-1.5 bg-surface-container-high/60 p-1 rounded-xl border border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setVistaDetalleHistorico('meses')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      vistaDetalleHistorico === 'meses'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Resumen por Meses ({desgloseHistoricoPorMes.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaDetalleHistorico('cobranzas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      vistaDetalleHistorico === 'cobranzas'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Todas las Cobranzas ({pagos.length})</span>
                  </button>
                </div>

                {/* Botones de Acción: Imprimir y Excel */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={imprimirPDFHistorico}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-primary/20 shadow-2xs"
                    title="Imprimir reporte formal en formato A4"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimir / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportarExcelHistorico}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-600/20 shadow-2xs"
                    title="Descargar libro en formato Excel (.xls)"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Excel (.xls)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA 1: RESUMEN MENSUAL */}
            {vistaDetalleHistorico === 'meses' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider border-b border-outline-variant">
                      <th className="p-3">Período / Mes</th>
                      <th className="p-3 text-center">N° Cobros</th>
                      <th className="p-3 text-right">Ingresos por Estancias</th>
                      <th className="p-3 text-right">Gastos Deducidos</th>
                      <th className="p-3 text-right">Flujo Neto</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {desgloseHistoricoPorMes.map((m) => (
                      <tr key={m.mesNombre} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="p-3 font-bold text-on-surface flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{m.mesNombre}</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-bold">
                            {m.numPagos} pagos
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 font-mono">
                          S/. {m.ingresos.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-error font-mono">
                          S/. {m.egresos.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-black font-mono text-primary">
                          S/. {m.balance.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <Link
                            to="/reportes"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-container px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <span>Ver Liquidación</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-surface-container font-black text-xs">
                      <td className="p-3 uppercase">Total Histórico Acumulado:</td>
                      <td className="p-3 text-center font-mono">{pagos.length} pagos</td>
                      <td className="p-3 text-right font-mono text-emerald-600">S/. {ingresosHistorico.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-error">S/. {egresosHistorico.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-primary">S/. {balanceHistorico.toFixed(2)}</td>
                      <td className="p-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA 2: TODAS LAS COBRANZAS HISTÓRICAS */}
            {vistaDetalleHistorico === 'cobranzas' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={busquedaHistorica}
                    onChange={(e) => setBusquedaHistorica(e.target.value)}
                    placeholder="Buscar por huésped, habitación o concepto..."
                    className="w-full max-w-sm px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Mostrando {cobranzasHistoricasFiltradas.length} de {pagos.length} transacciones
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider border-b border-outline-variant z-10">
                      <tr>
                        <th className="p-3">Fecha y Hora</th>
                        <th className="p-3">Método</th>
                        <th className="p-3">Huésped</th>
                        <th className="p-3 text-center">Habitación</th>
                        <th className="p-3">Concepto</th>
                        <th className="p-3 text-right">Monto (S/.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {cobranzasHistoricasFiltradas.map((p: any, idx: number) => {
                        const m = (p.metodoPago || 'efectivo').toLowerCase();
                        const badgeColor = m === 'yape'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : m === 'plin'
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          : m === 'efectivo'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : m === 'tarjeta'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300';

                        return (
                          <tr key={p.id || idx} className="hover:bg-surface-container-low/70 transition-colors">
                            <td className="p-2.5 font-mono text-[11px] text-on-surface-variant">
                              {new Date(p.fecha).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${badgeColor}`}>
                                {m}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-on-surface capitalize">
                              {p.huesped?.nombre || 'Particular / Directo'}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-lg bg-surface-container font-bold text-on-surface text-[11px]">
                                Hab. {p.estancia?.habitacion?.numero || 'S/N'}
                              </span>
                            </td>
                            <td className="p-2.5 text-on-surface-variant text-[11px]">
                              {p.concepto || 'Abono'}
                            </td>
                            <td className="p-2.5 text-right font-black font-mono text-emerald-600 text-xs">
                              S/. {Number(p.monto || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: HABITACIONES */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Ocupación y Habitaciones</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Disponibles</p>
              <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                <DoorOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">{resumen.habitacionesDisponibles}</h3>
              <span className="text-xs text-on-surface-variant font-medium">unidades</span>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Ocupadas</p>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <BedDouble className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold">{resumen.habitacionesOcupadas}</h3>
                <span className="text-xs text-on-surface-variant font-medium">de {resumen.totalHabitaciones}</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${porcentajeOcupacion}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{porcentajeOcupacion}% de Ocupación</p>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">En Limpieza</p>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <h3 className="text-3xl font-bold">{resumen.habitacionesEnLimpieza}</h3>
              <span className="text-xs text-on-surface-variant font-medium">por revisar</span>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Total Unidades</p>
              <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg">
                <Hotel className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold">{resumen.totalHabitaciones}</h3>
              <p className="text-[10px] text-on-surface-variant uppercase font-medium mt-1">Capacidad Instalada</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: CONTROL OPERATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estancias Vencidas */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-sm text-on-surface">Estancias Vencidas</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                estanciasVencidasAdmin.length > 0
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}>
                {estanciasVencidasAdmin.length > 0 ? `${estanciasVencidasAdmin.length} con saldo pendiente` : '\u2713 Todo al día'}
              </span>
            </div>

            {estanciasVencidasAdmin.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Sin estancias vencidas</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Todos los huéspedes están al día con sus pagos.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/40 flex-1">
                {salidasPaginadas.map((item: any) => (
                  <div key={item.estanciaId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-500/[0.02] hover:bg-red-500/5 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="bg-red-500 text-white h-11 w-11 rounded-xl font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                        {item.habitacionNumero}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-on-surface-variant/70" />
                          <p className="font-bold text-sm text-on-surface leading-none">{item.huespedNombre}</p>
                        </div>
                        {item.huespedDni && <p className="text-[11px] text-on-surface-variant font-mono">DNI: {item.huespedDni}</p>}
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                          <AlertCircle className="h-2.5 w-2.5" /> Sobretiempo
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Por Cobrar</p>
                      <p className="text-base font-black text-red-500 mt-0.5">S/. {Number(item.montoPendienteAproximado).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPaginasSalidas > 1 && (
            <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/20 text-xs mt-auto">
              <button onClick={() => setPaginaSalidas(prev => Math.max(prev - 1, 1))} disabled={paginaSalidas === 1} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Anterior</button>
              <span className="font-bold text-on-surface-variant">Página {paginaSalidas} de {totalPaginasSalidas}</span>
              <button onClick={() => setPaginaSalidas(prev => Math.min(prev + 1, totalPaginasSalidas))} disabled={paginaSalidas === totalPaginasSalidas} className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Siguiente</button>
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="bg-surface-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Actividad Reciente</h3>
            </div>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto max-h-[320px]">
            {actividades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <span className="text-lg">📜</span>
                <p className="text-xs text-on-surface-variant mt-1">No se registran actividades hoy.</p>
              </div>
            ) : (
              <div className="relative border-l border-outline-variant/65 ml-3 pl-4 space-y-5 py-2">
                {actividades.slice(0, 5).map((act) => (
                  <div key={act.id} className="relative text-left">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-surface-lowest" />
                    <p className="text-xs font-bold text-on-surface leading-snug">{act.accion}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant font-medium">
                      <span className="capitalize bg-surface-container-high px-1.5 py-0.5 rounded font-bold text-primary">{act.usuario || 'recepción'}</span>
                      <span>•</span>
                      <span>{new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accesos Directos */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-lowest to-surface-lowest border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black text-primary uppercase tracking-wider">Consola de Control del Administrador</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">Gestione personal del hotel, audite los gastos registrados y configure tarifas de hospedaje.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/usuarios" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <UserCog className="h-4 w-4 text-amber-500" />
            <span>Gestionar Personal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/auditoria-caja" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <History className="h-4 w-4 text-primary" />
            <span>Ver Auditoría de Caja</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/configuraciones" className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm transition-all">
            <Settings className="h-4 w-4 text-on-surface-variant" />
            <span>Configuración</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </div>
  );
};
