import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  Plus,
  Trash2,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  HelpCircle,
  ExternalLink,
  X,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../../data/adapters/api.adapter';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { ModalRegistrarGastoAdmin } from './ModalRegistrarGastoAdmin';

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
  evidenciaUrl?: string | null;
  huesped?: { nombre: string };
  estancia?: { habitacion?: { numero: string } };
  sesionCaja?: { usuario?: { nombre: string } };
}

interface GastoRegistro {
  id: string;
  monto: number;
  concepto: string;
  categoria?: string;
  comprobante_url?: string | null;
  observaciones?: string | null;
  fecha: string;
  usuario: string;
  sesionCajaId?: string | null;
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const LiquidacionMensualPanel: React.FC = () => {
  const ahora = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(ahora.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(ahora.getMonth());

  const [loading, setLoading] = useState<boolean>(true);
  const [salidas, setSalidas] = useState<HistorialRegistro[]>([]);
  const [pagos, setPagos] = useState<PagoRegistro[]>([]);
  const [gastos, setGastos] = useState<GastoRegistro[]>([]);
  
  // Saldo inicial previo anotado antes de usar el sistema
  const [saldoPrevio, setSaldoPrevio] = useState<string>('0');

  // Modales
  const [modalGastoAbierto, setModalGastoAbierto] = useState<boolean>(false);
  const [comprobantePreviewUrl, setComprobantePreviewUrl] = useState<string | null>(null);
  const [tituloPreviewModal, setTituloPreviewModal] = useState<string>('Comprobante Adjunto');

  // Sub-pestaña de visualización
  const [subTab, setSubTab] = useState<'gastos_admin' | 'pagos_yape' | 'checkouts'>('gastos_admin');

  // Cargar saldo previo guardado en localStorage para el mes seleccionado
  useEffect(() => {
    const key = `ajuste_saldo_mes_${selectedYear}_${selectedMonth}`;
    const guardado = localStorage.getItem(key);
    setSaldoPrevio(guardado || '0');
  }, [selectedYear, selectedMonth]);

  const handleGuardarSaldoPrevio = (valor: string) => {
    setSaldoPrevio(valor);
    const key = `ajuste_saldo_mes_${selectedYear}_${selectedMonth}`;
    localStorage.setItem(key, valor);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resSalidas, resPagos, resGastos] = await Promise.all([
        api.get<{ data: HistorialRegistro[] }>('/estancias/historial-salidas', { params: { limite: 10000 } }),
        api.get<PagoRegistro[]>('/caja-sesiones/pagos'),
        api.get<GastoRegistro[]>('/bitacora/gastos', { params: { mes: selectedMonth, anio: selectedYear } }),
      ]);

      setSalidas(resSalidas.data.data || []);
      setPagos(resPagos.data || []);
      setGastos(resGastos.data || []);
    } catch (err) {
      console.error('Error al cargar datos de liquidación:', err);
      AlertAdapter.error('Error', 'No se pudieron cargar los registros financieros del mes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [selectedYear, selectedMonth]);

  // Filtrar Check-Outs del mes seleccionado
  const checkOutsMes = useMemo(() => {
    return salidas.filter((s) => {
      if (!s.fechaSalida) return false;
      const d = new Date(s.fechaSalida);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [salidas, selectedYear, selectedMonth]);

  // Filtrar Pagos / Cobranzas del mes seleccionado
  const pagosMes = useMemo(() => {
    return pagos.filter((p) => {
      if (!p.fecha) return false;
      const d = new Date(p.fecha);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [pagos, selectedYear, selectedMonth]);

  // Desglosar Gastos: Caja Chica (de turnos) vs Administrativos (Fijos)
  const { gastosCajaChica, gastosAdministrativos } = useMemo(() => {
    const cajaChica: GastoRegistro[] = [];
    const admin: GastoRegistro[] = [];

    gastos.forEach((g) => {
      const cat = g.categoria || (g.sesionCajaId ? 'caja_chica' : 'otros');
      if (cat === 'caja_chica' || g.sesionCajaId) {
        cajaChica.push(g);
      } else {
        admin.push(g);
      }
    });

    return { gastosCajaChica: cajaChica, gastosAdministrativos: admin };
  }, [gastos]);

  // Desglose de cobranzas por método
  const metodosCobro = useMemo(() => {
    const mapa: { [k: string]: { total: number; conteo: number } } = {
      efectivo: { total: 0, conteo: 0 },
      yape: { total: 0, conteo: 0 },
      plin: { total: 0, conteo: 0 },
      transferencia: { total: 0, conteo: 0 },
      tarjeta: { total: 0, conteo: 0 },
    };

    pagosMes.forEach((p) => {
      const m = (p.metodoPago || 'efectivo').toLowerCase();
      const monto = Number(p.monto || 0);
      if (m in mapa) {
        mapa[m].total += monto;
        mapa[m].conteo += 1;
      } else {
        mapa['efectivo'].total += monto;
        mapa['efectivo'].conteo += 1;
      }
    });
    return mapa;
  }, [pagosMes]);

  // Totales financieros
  const totalCobradoCheckouts = checkOutsMes.reduce((sum, s) => sum + Number(s.montoTotalPagado || 0), 0);
  const totalCobradoPagos = pagosMes.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  
  const totalIngresosSistema = Math.max(totalCobradoCheckouts, totalCobradoPagos);
  const ajusteInicial = parseFloat(saldoPrevio) || 0;
  const totalIngresosBrutos = totalIngresosSistema + ajusteInicial;

  const totalEfectivo = metodosCobro['efectivo'].total;
  const totalDigital = (metodosCobro['yape'].total + metodosCobro['plin'].total + metodosCobro['transferencia'].total + metodosCobro['tarjeta'].total);

  const totalGastosCajaChica = gastosCajaChica.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  const totalGastosAdministrativos = gastosAdministrativos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  const totalGastosGenerales = totalGastosCajaChica + totalGastosAdministrativos;

  const gananciaNetaLiquida = totalIngresosBrutos - totalGastosGenerales;
  const efectivoFisicoEnMano = Math.max(0, totalEfectivo - totalGastosCajaChica);

  // Navegación de mes
  const cambiarMes = (delta: number) => {
    let nuevoMes = selectedMonth + delta;
    let nuevoAnio = selectedYear;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setSelectedMonth(nuevoMes);
    setSelectedYear(nuevoAnio);
  };

  const irAMesActual = () => {
    setSelectedMonth(ahora.getMonth());
    setSelectedYear(ahora.getFullYear());
  };

  const handleEliminarGasto = async (id: string) => {
    const confirmado = await AlertAdapter.confirm(
      '¿Eliminar Gasto?',
      'Esta acción eliminará el registro del gasto y actualizará el balance mensual.',
    );
    if (confirmado) {
      try {
        await api.delete(`/bitacora/gastos-administrativos/${id}`);
        AlertAdapter.toast('Gasto eliminado', 'info');
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar gasto:', err);
        AlertAdapter.error('Error', 'No se pudo eliminar el gasto.');
      }
    }
  };

  // Helper para URL de archivos
  const getArchivoUrl = (url: string, tipo: 'pago' | 'gasto' = 'pago') => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const filename = url.replace(/^(\/)?uploads\/(pagos|boletas)\//, '');
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
    if (tipo === 'pago') {
      return `${apiBase}/caja-sesiones/pagos/evidencia/${filename}`;
    }
    return `${apiBase}/bitacora/comprobante/${filename}`;
  };

  const abrirModalPreview = (url: string, titulo: string, tipo: 'pago' | 'gasto') => {
    setTituloPreviewModal(titulo);
    setComprobantePreviewUrl(getArchivoUrl(url, tipo));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EXPORTACIÓN A EXCEL PREMIUM (.XLS CON FORMATO CORPORATIVO)
  // ─────────────────────────────────────────────────────────────────────────────
  const exportarExcel = () => {
    const mesNombre = NOMBRES_MESES[selectedMonth];
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #1e293b; }
          .title-banner { background-color: #006b4d; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 35px; vertical-align: middle; }
          .subtitle { color: #64748b; font-size: 10pt; text-align: center; }
          
          .sec-header { background-color: #0f766e; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; }
          .sec-yape { background-color: #6b21a8; color: #ffffff; font-weight: bold; font-size: 11pt; padding: 6px 10px; }
          .table-th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left; border: 1px solid #cbd5e1; padding: 6px; }
          .table-th-center { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 6px; }
          .table-th-right { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: right; border: 1px solid #cbd5e1; padding: 6px; }
          
          td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: middle; }
          .num { text-align: right; mso-number-format: '"S/."\\ #\\,##0\\.00'; font-variant-numeric: tabular-nums; }
          .center { text-align: center; }
          
          .kpi-label { font-weight: bold; color: #475569; background-color: #f8fafc; }
          .kpi-val-green { font-weight: bold; color: #047857; text-align: right; mso-number-format: '"S/."\\ #\\,##0\\.00'; background-color: #f8fafc; }
          .kpi-val-red { font-weight: bold; color: #b91c1c; text-align: right; mso-number-format: '"S/."\\ #\\,##0\\.00'; background-color: #f8fafc; }
          .kpi-val-purple { font-weight: bold; color: #7e22ce; text-align: right; mso-number-format: '"S/."\\ #\\,##0\\.00'; background-color: #f8fafc; }
          
          .net-banner { background-color: #d1fae5; color: #065f46; font-size: 13pt; font-weight: bold; border: 2px solid #10b981; }
          .badge-yape { background-color: #f3e8ff; color: #7e22ce; font-weight: bold; text-align: center; }
          .badge-plin { background-color: #e0f2fe; color: #0284c7; font-weight: bold; text-align: center; }
          .badge-efectivo { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
          .badge-transf { background-color: #dbeafe; color: #1d4ed8; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <!-- ENCABEZADO -->
          <tr><td colspan="7" class="title-banner">HOSPEDAJE RAYZA — LIQUIDACIÓN Y BALANCE MENSUAL</td></tr>
          <tr><td colspan="7" class="subtitle">Período Contable: <b>${mesNombre.toUpperCase()} ${selectedYear}</b> | Generado: ${new Date().toLocaleString()}</td></tr>
          <tr><td colspan="7"></td></tr>

          <!-- 1. RESUMEN EJECUTIVO Y FONDOS -->
          <tr><td colspan="7" class="sec-header">I. RESUMEN EJECUTIVO Y CONCILIACIÓN DE FONDOS</td></tr>
          <tr>
            <td colspan="4" class="kpi-label">Total Ingresos por Estancias y Cobranzas:</td>
            <td colspan="3" class="kpi-val-green">S/. ${totalIngresosSistema.toFixed(2)}</td>
          </tr>
          ${ajusteInicial > 0 ? `
          <tr>
            <td colspan="4" class="kpi-label">Ingresos Previos al Sistema (Ajuste Inicial de Mes):</td>
            <td colspan="3" class="kpi-val-green">S/. ${ajusteInicial.toFixed(2)}</td>
          </tr>` : ''}
          <tr style="background-color: #e2e8f0; font-weight: bold;">
            <td colspan="4">TOTAL INGRESOS BRUTOS:</td>
            <td colspan="3" class="num" style="color: #047857;">S/. ${totalIngresosBrutos.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-label">💵 Recaudado en Efectivo Físico:</td>
            <td colspan="3" class="num" style="color: #15803d; font-weight: bold;">S/. ${totalEfectivo.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-label">📱 Recaudado por Canales Digitales (Yape / Plin / Transferencias / Tarjeta):</td>
            <td colspan="3" class="kpi-val-purple">S/. ${totalDigital.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-label">(-) Gastos Diarios de Turno (Caja Chica Recepción):</td>
            <td colspan="3" class="kpi-val-red">S/. ${totalGastosCajaChica.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-label">(-) Gastos Administrativos de Fin de Mes (Personal, Luz, Agua, etc.):</td>
            <td colspan="3" class="kpi-val-red">S/. ${totalGastosAdministrativos.toFixed(2)}</td>
          </tr>
          <tr style="background-color: #fee2e2; font-weight: bold;">
            <td colspan="4">TOTAL EGRESOS / GASTOS DEDUCIDOS:</td>
            <td colspan="3" class="num" style="color: #b91c1c;">S/. ${totalGastosGenerales.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="4" class="net-banner">UTILIDAD / GANANCIA NETA LÍQUIDA PARA EL DUEÑO:</td>
            <td colspan="3" class="net-banner num">S/. ${gananciaNetaLiquida.toFixed(2)}</td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- 2. DESGLOSE DE COBRANZAS POR MÉTODO (YAPE, PLIN, EFECTIVO) -->
          <tr><td colspan="7" class="sec-yape">II. DESGLOSE DE COBRANZAS POR MÉTODO DE PAGO</td></tr>
          <tr>
            <td colspan="3" class="table-th">Método de Pago</td>
            <td colspan="2" class="table-th-center">N° Operaciones</td>
            <td colspan="2" class="table-th-right">Total Cobrado (S/.)</td>
          </tr>
          <tr>
            <td colspan="3" class="badge-yape">📱 YAPE</td>
            <td colspan="2" class="center">${metodosCobro['yape'].conteo}</td>
            <td colspan="2" class="num" style="color:#7e22ce; font-weight:bold;">S/. ${metodosCobro['yape'].total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="badge-plin">📲 PLIN</td>
            <td colspan="2" class="center">${metodosCobro['plin'].conteo}</td>
            <td colspan="2" class="num" style="color:#0284c7; font-weight:bold;">S/. ${metodosCobro['plin'].total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="badge-efectivo">💵 EFECTIVO</td>
            <td colspan="2" class="center">${metodosCobro['efectivo'].conteo}</td>
            <td colspan="2" class="num" style="color:#15803d; font-weight:bold;">S/. ${metodosCobro['efectivo'].total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" class="badge-transf">🏦 TRANSFERENCIA / BCP</td>
            <td colspan="2" class="center">${metodosCobro['transferencia'].conteo}</td>
            <td colspan="2" class="num" style="color:#1d4ed8; font-weight:bold;">S/. ${metodosCobro['transferencia'].total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3">💳 TARJETA</td>
            <td colspan="2" class="center">${metodosCobro['tarjeta'].conteo}</td>
            <td colspan="2" class="num" style="font-weight:bold;">S/. ${metodosCobro['tarjeta'].total.toFixed(2)}</td>
          </tr>
          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td colspan="3">TOTAL COBRANZAS:</td>
            <td colspan="2" class="center">${pagosMes.length}</td>
            <td colspan="2" class="num" style="color:#047857;">S/. ${totalCobradoPagos.toFixed(2)}</td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <!-- 3. DETALLE DE PAGOS CON EVIDENCIAS -->
          <tr><td colspan="7" class="sec-header">III. HISTORIAL DE PAGOS Y COBRANZAS (CON REGISTRO DE YAPE/EVIDENCIAS)</td></tr>
          <tr>
            <td class="table-th-center">Fecha y Hora</td>
            <td class="table-th-center">Método</td>
            <td class="table-th">Huésped</td>
            <td class="table-th-center">Habitación</td>
            <td class="table-th">Concepto</td>
            <td class="table-th-center">Comprobante / Captura</td>
            <td class="table-th-right">Monto (S/.)</td>
          </tr>
    `;

    if (pagosMes.length === 0) {
      html += `<tr><td colspan="7" class="center" style="color:#94a3b8;">No se registraron cobranzas en este mes</td></tr>`;
    } else {
      pagosMes.forEach((p) => {
        const m = (p.metodoPago || 'efectivo').toUpperCase();
        const badgeClass = m === 'YAPE' ? 'badge-yape' : (m === 'PLIN' ? 'badge-plin' : (m === 'EFECTIVO' ? 'badge-efectivo' : 'badge-transf'));
        const tieneEvidencia = p.evidenciaUrl ? 'Adjunto (En Sistema)' : 'Sin captura';

        html += `
          <tr>
            <td class="center">${new Date(p.fecha).toLocaleString()}</td>
            <td class="${badgeClass}">${m}</td>
            <td style="text-transform: capitalize;">${p.huesped?.nombre || 'Particular'}</td>
            <td class="center">Hab. ${p.estancia?.habitacion?.numero || 'S/N'}</td>
            <td>${p.concepto || 'Abono'}</td>
            <td class="center" style="font-size: 9pt; color: ${p.evidenciaUrl ? '#047857' : '#94a3b8'};">${tieneEvidencia}</td>
            <td class="num font-bold">S/. ${Number(p.monto).toFixed(2)}</td>
          </tr>
        `;
      });
      html += `
        <tr style="background-color:#f1f5f9; font-weight:bold;">
          <td colspan="6" style="text-align:right;">Total Pagos Registrados:</td>
          <td class="num font-bold" style="color:#047857;">S/. ${totalCobradoPagos.toFixed(2)}</td>
        </tr>
      `;
    }

    html += `
          <tr><td colspan="7"></td></tr>
          <!-- 4. GASTOS ADMINISTRATIVOS -->
          <tr><td colspan="7" class="sec-header">IV. DETALLE DE GASTOS ADMINISTRATIVOS (PERSONAL Y SERVICIOS)</td></tr>
          <tr>
            <td class="table-th-center">Fecha</td>
            <td class="table-th-center">Categoría</td>
            <td colspan="3" class="table-th">Descripción del Gasto</td>
            <td class="table-th">Registrado Por</td>
            <td class="table-th-right">Monto (S/.)</td>
          </tr>
    `;

    if (gastosAdministrativos.length === 0) {
      html += `<tr><td colspan="7" class="center" style="color:#94a3b8;">No se registraron gastos administrativos en este mes</td></tr>`;
    } else {
      gastosAdministrativos.forEach((g) => {
        const cat = g.categoria === 'personal' ? 'Pago Personal' : (g.categoria === 'servicios' ? 'Servicios Básicos' : (g.categoria === 'mantenimiento' ? 'Mantenimiento' : 'Otros'));
        html += `
          <tr>
            <td class="center">${new Date(g.fecha).toLocaleDateString()}</td>
            <td class="center">${cat}</td>
            <td colspan="3">${g.concepto}</td>
            <td>${g.usuario}</td>
            <td class="num" style="color:#b91c1c; font-weight:bold;">S/. ${Number(g.monto).toFixed(2)}</td>
          </tr>
        `;
      });
      html += `
        <tr style="background-color:#f1f5f9; font-weight:bold;">
          <td colspan="6" style="text-align:right;">Total Gastos Administrativos:</td>
          <td class="num font-bold" style="color:#b91c1c;">S/. ${totalGastosAdministrativos.toFixed(2)}</td>
        </tr>
      `;
    }

    html += `
          <tr><td colspan="7"></td></tr>
          <!-- 5. CHECK-OUTS HISTÓRICOS -->
          <tr><td colspan="7" class="sec-header">V. HISTORIAL DE CLIENTES Y CHECK-OUTS CONCLUIDOS</td></tr>
          <tr>
            <td class="table-th-center">Check-In</td>
            <td class="table-th-center">Check-Out</td>
            <td colspan="2" class="table-th">Huésped</td>
            <td class="table-th-center">DNI</td>
            <td class="table-th-center">Habitación</td>
            <td class="table-th-right">Total Pagado (S/.)</td>
          </tr>
    `;

    if (checkOutsMes.length === 0) {
      html += `<tr><td colspan="7" class="center" style="color:#94a3b8;">No hay check-outs registrados en este período</td></tr>`;
    } else {
      checkOutsMes.forEach((s) => {
        html += `
          <tr>
            <td class="center">${new Date(s.fechaEntrada).toLocaleDateString()}</td>
            <td class="center">${new Date(s.fechaSalida).toLocaleDateString()}</td>
            <td colspan="2" style="text-transform: capitalize;">${s.huespedNombre}</td>
            <td class="center font-mono">${s.huespedDni}</td>
            <td class="center">Hab. ${s.habitacionNumero}</td>
            <td class="num font-bold">S/. ${Number(s.montoTotalPagado).toFixed(2)}</td>
          </tr>
        `;
      });
      html += `
        <tr style="background-color:#f1f5f9; font-weight:bold;">
          <td colspan="6" style="text-align:right;">Total Recaudado en Check-Outs:</td>
          <td class="num font-bold" style="color:#047857;">S/. ${totalCobradoCheckouts.toFixed(2)}</td>
        </tr>
      `;
    }

    html += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Liquidacion_${mesNombre}_${selectedYear}_Hospedaje_Rayza.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    AlertAdapter.toast('Liquidación exportada a Excel', 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EXPORTACIÓN A PDF / IMPRESIÓN EJECUTIVA A4
  // ─────────────────────────────────────────────────────────────────────────────
  const imprimirPDF = () => {
    const mesNombre = NOMBRES_MESES[selectedMonth];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      AlertAdapter.error('Error', 'Permita las ventanas emergentes para generar el reporte de impresión.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Liquidación Mensual - ${mesNombre} ${selectedYear} - Hospedaje Rayza</title>
        <style>
          @page { size: A4; margin: 12mm 12mm 12mm 12mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; font-size: 10.5px; }
          .header { border-bottom: 2px solid #006b4d; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; color: #006b4d; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 2px 0 0; color: #64748b; font-size: 10px; }
          .badge-periodo { background: #e6f4ea; color: #006b4d; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 11px; border: 1px solid #b7e1cd; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
          .kpi-card.highlight { background: #d1fae5; border-color: #10b981; }
          .kpi-card .label { font-size: 8.5px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px; }
          .kpi-card .value { font-size: 14px; font-weight: 900; color: #0f172a; }
          .kpi-card.highlight .value { color: #047857; font-size: 16px; }

          .desglose-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 10px; }
          
          h2 { font-size: 11px; font-weight: bold; color: #006b4d; text-transform: uppercase; margin: 14px 0 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5px; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; text-align: left; padding: 5px 6px; border: 1px solid #cbd5e1; }
          td { padding: 4px 6px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fafafa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          
          .badge-m { padding: 1px 5px; border-radius: 4px; font-weight: bold; font-size: 8.5px; }
          .b-yape { background: #f3e8ff; color: #7e22ce; }
          .b-plin { background: #e0f2fe; color: #0284c7; }
          .b-efectivo { background: #dcfce7; color: #15803d; }
          .b-transf { background: #dbeafe; color: #1d4ed8; }

          .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
          .firma-box { border-top: 1px solid #334155; text-align: center; padding-top: 5px; }
          .firma-box p { margin: 2px 0; font-size: 9.5px; color: #475569; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Hospedaje Rayza</h1>
            <p>Rendición de Cuentas y Liquidación Financiera Mensual</p>
          </div>
          <div>
            <div class="badge-periodo">MES: ${mesNombre.toUpperCase()} ${selectedYear}</div>
          </div>
        </div>

        <!-- RESUMEN EN TARJETAS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">Ingresos Totales</div>
            <div class="value" style="color: #006b4d;">S/. ${totalIngresosBrutos.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Gastos Turno (Caja)</div>
            <div class="value" style="color: #ba1a1a;">S/. ${totalGastosCajaChica.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Personal y Servicios</div>
            <div class="value" style="color: #ba1a1a;">S/. ${totalGastosAdministrativos.toFixed(2)}</div>
          </div>
          <div class="kpi-card highlight">
            <div class="label">Ganancia Líquida Neta</div>
            <div class="value">S/. ${gananciaNetaLiquida.toFixed(2)}</div>
          </div>
        </div>

        <!-- CONCILIACIÓN DE FONDOS: EFECTIVO VS DIGITAL -->
        <div class="desglose-box">
          <div>💵 <b>Efectivo Físico en Caja:</b> S/. ${totalEfectivo.toFixed(2)} &nbsp;|&nbsp; <b>Efectivo Neto a Entregar:</b> S/. ${efectivoFisicoEnMano.toFixed(2)}</div>
          <div>📱 <b>Canales Digitales (Yape/Plin/Banco):</b> S/. ${totalDigital.toFixed(2)} (Yape: S/. ${metodosCobro['yape'].total.toFixed(2)} · Plin: S/. ${metodosCobro['plin'].total.toFixed(2)})</div>
        </div>

        <!-- SECCIÓN 1: GASTOS ADMINISTRATIVOS -->
        <h2>1. Detalle de Gastos Administrativos (Planilla, Servicios Básicos y Fijos)</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 70px;">Fecha</th>
              <th style="width: 100px;">Categoría</th>
              <th>Descripción del Gasto</th>
              <th style="width: 90px;">Registrado Por</th>
              <th class="text-right" style="width: 80px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${gastosAdministrativos.length === 0 ? '<tr><td colspan="5" class="text-center" style="color:#94a3b8;">Sin gastos administrativos registrados</td></tr>' : gastosAdministrativos.map(g => {
              const cat = g.categoria === 'personal' ? '👷 Personal' : (g.categoria === 'servicios' ? '💡 Servicios' : (g.categoria === 'mantenimiento' ? '🔧 Mantenimiento' : '📦 Otros'));
              return `
                <tr>
                  <td class="text-center">${new Date(g.fecha).toLocaleDateString()}</td>
                  <td>${cat}</td>
                  <td>${g.concepto}</td>
                  <td>${g.usuario}</td>
                  <td class="text-right font-bold" style="color:#ba1a1a;">S/. ${Number(g.monto).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background: #f1f5f9;">
              <td colspan="4" class="text-right font-bold">Total Gastos Administrativos:</td>
              <td class="text-right font-bold" style="color:#ba1a1a;">S/. ${totalGastosAdministrativos.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- SECCIÓN 2: HISTORIAL DE CLIENTES Y CHECK-OUTS -->
        <h2>2. Historial de Estancias y Check-Outs del Período</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 70px;">Check-In</th>
              <th class="text-center" style="width: 70px;">Check-Out</th>
              <th>Huésped</th>
              <th class="text-center" style="width: 75px;">DNI</th>
              <th class="text-center" style="width: 75px;">Habitación</th>
              <th class="text-right" style="width: 80px;">Monto Pagado</th>
            </tr>
          </thead>
          <tbody>
            ${checkOutsMes.length === 0 ? '<tr><td colspan="6" class="text-center" style="color:#94a3b8;">Sin check-outs registrados en el período</td></tr>' : checkOutsMes.map(s => `
              <tr>
                <td class="text-center">${new Date(s.fechaEntrada).toLocaleDateString()}</td>
                <td class="text-center">${new Date(s.fechaSalida).toLocaleDateString()}</td>
                <td style="text-transform: capitalize;">${s.huespedNombre}</td>
                <td class="text-center font-mono">${s.huespedDni}</td>
                <td class="text-center font-bold">Hab. ${s.habitacionNumero}</td>
                <td class="text-right font-bold">S/. ${Number(s.montoTotalPagado).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f1f5f9;">
              <td colspan="5" class="text-right font-bold">Total Check-Outs del Mes:</td>
              <td class="text-right font-bold" style="color:#006b4d;">S/. ${totalCobradoCheckouts.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- FIRMAS -->
        <div class="firmas">
          <div class="firma-box">
            <p class="font-bold">ADMINISTRADOR / GERENTE</p>
            <p>Rinde Cuenta del Mes</p>
          </div>
          <div class="firma-box">
            <p class="font-bold">PROPIETARIO / DUEÑO</p>
            <p>Conformidad de Liquidación Recibida</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* ─── BARRA SUPERIOR DE CONTROL DE MES Y ACCIONES ──────────────────────── */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* NAVEGACIÓN DE MES */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-2 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={irAMesActual}
              className="px-3 py-1.5 text-xs font-bold hover:bg-surface-container-high border-x border-outline-variant text-primary transition-colors cursor-pointer"
            >
              Mes Actual
            </button>
            <button
              onClick={() => cambiarMes(1)}
              className="p-2 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-xl font-black text-on-surface flex items-center gap-2 capitalize">
              <Calendar className="h-5 w-5 text-primary" />
              {NOMBRES_MESES[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-xs text-on-surface-variant">Liquidación ejecutiva para rendición ante el dueño</p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN: NUEVO GASTO + EXPORTAR EXCEL + IMPRIMIR PDF */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <button
            onClick={() => setModalGastoAbierto(true)}
            className="px-3.5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Registrar Gasto (Personal / Servicios)
          </button>

          <button
            onClick={exportarExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Descargar libro Excel profesional con todas las tablas"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
          </button>

          <button
            onClick={imprimirPDF}
            className="px-3 py-2 bg-surface-container-high hover:bg-outline-variant border border-outline-variant text-on-surface rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Imprimir balance ejecutivo A4 o guardar como PDF"
          >
            <Printer className="h-4 w-4 text-primary" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE MÉTRICAS FINANCIERAS (KPIS) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. TOTAL INGRESOS */}
        <div className="p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Ingresos</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-primary mt-2">
            S/. {totalIngresosBrutos.toFixed(2)}
          </p>
          <span className="text-[11px] text-on-surface-variant">
            {checkOutsMes.length} check-outs concluidos
          </span>
        </div>

        {/* 2. GASTOS DE TURNO / CAJA CHICA */}
        <div className="p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gastos Diarios (Caja)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            S/. {totalGastosCajaChica.toFixed(2)}
          </p>
          <span className="text-[11px] text-on-surface-variant">
            {gastosCajaChica.length} retiros de caja chica
          </span>
        </div>

        {/* 3. GASTOS ADMINISTRATIVOS */}
        <div className="p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Personal y Servicios</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">
            S/. {totalGastosAdministrativos.toFixed(2)}
          </p>
          <span className="text-[11px] text-on-surface-variant">
            {gastosAdministrativos.length} gastos fijos registrados
          </span>
        </div>

        {/* 4. GANANCIA LÍQUIDA NETA */}
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Ganancia Neta Líquida
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            S/. {gananciaNetaLiquida.toFixed(2)}
          </p>
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Utilidad líquida para el dueño
          </span>
        </div>
      </div>

      {/* ─── BANNER DE CONCILIACIÓN: EFECTIVO EN MANO VS CANALES DIGITALES (YAPE) ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* EFECTIVO FÍSICO */}
        <div className="p-4.5 bg-surface border-2 border-emerald-500/50 dark:border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-xs hover:border-emerald-500 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                💵 Efectivo Físico Recaudado
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                S/. {totalEfectivo.toFixed(2)}
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Efectivo neto tras gastos de caja: <span className="font-bold text-emerald-700 dark:text-emerald-300">S/. {efectivoFisicoEnMano.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* CANALES DIGITALES (YAPE / PLIN / TRANSFERENCIAS) */}
        <div className="p-4.5 bg-surface border-2 border-purple-500/50 dark:border-purple-500/40 rounded-2xl flex items-center justify-between shadow-xs hover:border-purple-500 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/30 shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                📱 Canales Digitales (Yape / Plin / Bancos)
              </span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                S/. {totalDigital.toFixed(2)}
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Yape: <b className="text-purple-600 dark:text-purple-400">S/. {metodosCobro['yape'].total.toFixed(2)}</b> · Plin: <b className="text-cyan-600 dark:text-cyan-400">S/. {metodosCobro['plin'].total.toFixed(2)}</b> · BCP: <b className="text-blue-600 dark:text-blue-400">S/. {metodosCobro['transferencia'].total.toFixed(2)}</b>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── CAJA DE AJUSTE DE INGRESOS PREVIOS AL SISTEMA ────────────────────── */}
      <div className="p-4 bg-surface-container-low border border-primary/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-on-surface">
          <HelpCircle className="h-5 w-5 text-primary shrink-0" />
          <div>
            <strong className="text-primary font-bold">Ingresos Previos al Sistema (Ajuste Inicial del Mes):</strong>
            <p className="text-on-surface-variant text-[11px]">
              Si empezó a usar el software a mitad de mes, puede sumar los cobros registrados previamente en cuaderno para completar la cuenta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-on-surface">S/.</span>
          <input
            type="number"
            min="0"
            step="10"
            value={saldoPrevio}
            onChange={(e) => handleGuardarSaldoPrevio(e.target.value)}
            className="w-32 bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-right font-black text-primary focus:ring-2 focus:ring-primary outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* ─── PESTAÑAS DE DETALLE ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* SELECTOR DE SUB-PESTAÑAS */}
        <div className="flex border-b border-outline-variant pb-2 gap-2 flex-wrap">
          <button
            onClick={() => setSubTab('gastos_admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'gastos_admin'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            👷 Gastos de Fin de Mes (Personal y Servicios) ({gastosAdministrativos.length})
          </button>

          <button
            onClick={() => setSubTab('pagos_yape')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'pagos_yape'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            📱 Cobranzas y Pagos Yape / Plin / Efectivo ({pagosMes.length})
          </button>
          
          <button
            onClick={() => setSubTab('checkouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'checkouts'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            🚪 Huéspedes y Check-Outs ({checkOutsMes.length})
          </button>
        </div>

        {/* 1. TAB: GASTOS ADMINISTRATIVOS */}
        {subTab === 'gastos_admin' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Detalle de Gastos de Fin de Mes (Planilla, Servicios y Mantenimiento)
              </h4>
              <span className="text-xs font-bold text-red-600">
                Total Gastos: S/. {totalGastosAdministrativos.toFixed(2)}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando gastos...
              </div>
            ) : gastosAdministrativos.length === 0 ? (
              <div className="p-8 border border-dashed border-outline-variant/60 rounded-xl text-center text-xs text-on-surface-variant">
                No se han registrado gastos administrativos para este mes.
                <div className="mt-2">
                  <button
                    onClick={() => setModalGastoAbierto(true)}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    + Registrar el primer gasto de personal o servicio
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider border-b border-outline-variant">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Registrado Por</th>
                      <th className="p-3 text-center">Comprobante / Recibo</th>
                      <th className="p-3 text-right">Monto (S/.)</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {gastosAdministrativos.map((g) => {
                      const catBadge = g.categoria === 'personal'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        : g.categoria === 'servicios'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : g.categoria === 'mantenimiento'
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                        : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
                      
                      const catLabel = g.categoria === 'personal'
                        ? '👷 Personal'
                        : g.categoria === 'servicios'
                        ? '💡 Servicios'
                        : g.categoria === 'mantenimiento'
                        ? '🔧 Mantenimiento'
                        : '📦 Otros';

                      return (
                        <tr key={g.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-3 text-on-surface-variant">
                            {new Date(g.fecha).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadge}`}>
                              {catLabel}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-on-surface">
                            {g.concepto}
                            {g.observaciones && (
                              <p className="text-[10px] text-on-surface-variant font-normal">{g.observaciones}</p>
                            )}
                          </td>
                          <td className="p-3 text-on-surface-variant">{g.usuario}</td>
                          <td className="p-3 text-center">
                            {g.comprobante_url ? (
                              <button
                                onClick={() => abrirModalPreview(g.comprobante_url!, `Recibo: ${g.concepto}`, 'gasto')}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" /> Ver Recibo
                              </button>
                            ) : (
                              <span className="text-[10px] text-on-surface-variant/40">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-black text-red-600 text-sm">
                            S/. {Number(g.monto).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleEliminarGasto(g.id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. TAB: COBRANZAS Y PAGOS YAPE / PLIN / EFECTIVO */}
        {subTab === 'pagos_yape' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Historial de Cobranzas y Evidencias de Pago (Yape / Plin / Efectivo)
              </h4>
              <span className="text-xs font-bold text-primary">
                Total Cobrado: S/. {totalCobradoPagos.toFixed(2)}
              </span>
            </div>

            {/* BADGES DE MÉTODOS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { 
                  label: 'Yape', 
                  key: 'yape', 
                  cardClass: 'border-2 border-purple-500/40 bg-surface',
                  titleClass: 'text-purple-800 dark:text-purple-300',
                  amountClass: 'text-purple-700 dark:text-purple-400',
                  subClass: 'text-purple-900/80 dark:text-purple-300/80',
                  iconClass: 'text-purple-600 dark:text-purple-400',
                  icon: <Smartphone className="h-4 w-4" /> 
                },
                { 
                  label: 'Plin', 
                  key: 'plin', 
                  cardClass: 'border-2 border-cyan-500/40 bg-surface',
                  titleClass: 'text-cyan-800 dark:text-cyan-300',
                  amountClass: 'text-cyan-700 dark:text-cyan-400',
                  subClass: 'text-cyan-900/80 dark:text-cyan-300/80',
                  iconClass: 'text-cyan-600 dark:text-cyan-400',
                  icon: <Smartphone className="h-4 w-4" /> 
                },
                { 
                  label: 'Efectivo', 
                  key: 'efectivo', 
                  cardClass: 'border-2 border-emerald-500/40 bg-surface',
                  titleClass: 'text-emerald-800 dark:text-emerald-300',
                  amountClass: 'text-emerald-700 dark:text-emerald-400',
                  subClass: 'text-emerald-900/80 dark:text-emerald-300/80',
                  iconClass: 'text-emerald-600 dark:text-emerald-400',
                  icon: <Wallet className="h-4 w-4" /> 
                },
                { 
                  label: 'Transferencia', 
                  key: 'transferencia', 
                  cardClass: 'border-2 border-blue-500/40 bg-surface',
                  titleClass: 'text-blue-800 dark:text-blue-300',
                  amountClass: 'text-blue-700 dark:text-blue-400',
                  subClass: 'text-blue-900/80 dark:text-blue-300/80',
                  iconClass: 'text-blue-600 dark:text-blue-400',
                  icon: <Building2 className="h-4 w-4" /> 
                },
                { 
                  label: 'Tarjeta', 
                  key: 'tarjeta', 
                  cardClass: 'border-2 border-amber-500/40 bg-surface',
                  titleClass: 'text-amber-800 dark:text-amber-300',
                  amountClass: 'text-amber-700 dark:text-amber-400',
                  subClass: 'text-amber-900/80 dark:text-amber-300/80',
                  iconClass: 'text-amber-600 dark:text-amber-400',
                  icon: <CreditCard className="h-4 w-4" /> 
                },
              ].map((m) => {
                const info = metodosCobro[m.key] || { total: 0, conteo: 0 };
                return (
                  <div key={m.key} className={`p-3 rounded-2xl ${m.cardClass} flex flex-col justify-between shadow-xs`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10.5px] font-black uppercase tracking-wider ${m.titleClass}`}>{m.label}</span>
                      <div className={m.iconClass}>{m.icon}</div>
                    </div>
                    <div className="mt-1.5">
                      <p className={`text-lg font-black ${m.amountClass}`}>S/. {info.total.toFixed(2)}</p>
                      <p className={`text-[10px] font-bold ${m.subClass}`}>{info.conteo} pagos</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagosMes.length === 0 ? (
              <div className="p-8 border border-dashed border-outline-variant/60 rounded-xl text-center text-xs text-on-surface-variant">
                No hay pagos registrados en este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider border-b border-outline-variant">
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3">Método de Pago</th>
                      <th className="p-3">Huésped</th>
                      <th className="p-3 text-center">Habitación</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3 text-center">Captura / Comprobante</th>
                      <th className="p-3 text-right">Monto (S/.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {pagosMes.map((p) => {
                      const m = (p.metodoPago || 'efectivo').toLowerCase();
                      const badgeColor = m === 'yape'
                        ? 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-300 border-purple-400'
                        : m === 'plin'
                        ? 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-400'
                        : m === 'efectivo'
                        ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400'
                        : m === 'tarjeta'
                        ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400'
                        : 'bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-300 border-blue-400';

                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-3 text-on-surface-variant">
                            {new Date(p.fecha).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                              {m}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-on-surface capitalize">
                            {p.huesped?.nombre || 'Particular'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-lg bg-surface-container font-bold text-on-surface">
                              Hab. {p.estancia?.habitacion?.numero || 'S/N'}
                            </span>
                          </td>
                          <td className="p-3 text-on-surface-variant">
                            {p.concepto || 'Abono'}
                          </td>
                          
                          {/* COLUMNA DE CAPTURA / COMPROBANTE HORIZONTAL */}
                          <td className="p-3 text-center">
                            {p.evidenciaUrl ? (
                              <button
                                onClick={() => abrirModalPreview(p.evidenciaUrl!, `Captura de Pago: ${m.toUpperCase()} - Hab. ${p.estancia?.habitacion?.numero || ''}`, 'pago')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <ImageIcon className="h-3 w-3" /> Ver Captura
                              </button>
                            ) : (
                              <span className="text-[10px] text-on-surface-variant/50 font-medium">Sin captura</span>
                            )}
                          </td>

                          <td className="p-3 text-right font-black text-primary text-sm">
                            S/. {Number(p.monto).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. TAB: CHECK-OUTS HISTÓRICOS */}
        {subTab === 'checkouts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Huéspedes y Estancias con Check-Out Concluido en {NOMBRES_MESES[selectedMonth]} {selectedYear}
              </h4>
              <span className="text-xs font-bold text-primary">
                Total Check-Outs: S/. {totalCobradoCheckouts.toFixed(2)}
              </span>
            </div>

            {checkOutsMes.length === 0 ? (
              <div className="p-8 border border-dashed border-outline-variant/60 rounded-xl text-center text-xs text-on-surface-variant">
                No hay check-outs registrados en este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider border-b border-outline-variant">
                      <th className="p-3">Ingreso</th>
                      <th className="p-3">Salida</th>
                      <th className="p-3">Huésped</th>
                      <th className="p-3 text-center">DNI</th>
                      <th className="p-3 text-center">Habitación</th>
                      <th className="p-3 text-right">Total Cobrado (S/.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {checkOutsMes.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3 text-on-surface-variant">
                          {new Date(s.fechaEntrada).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-on-surface-variant font-bold">
                          {new Date(s.fechaSalida).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-semibold text-on-surface capitalize">
                          {s.huespedNombre}
                        </td>
                        <td className="p-3 text-center font-mono text-on-surface-variant">
                          {s.huespedDni}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container font-bold text-on-surface">
                            Hab. {s.habitacionNumero}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-primary text-sm">
                          S/. {Number(s.montoTotalPagado).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── MODAL PARA REGISTRAR GASTO ADMINISTRATIVO ──────────────────────── */}
      <ModalRegistrarGastoAdmin
        isOpen={modalGastoAbierto}
        onClose={() => setModalGastoAbierto(false)}
        onGastoRegistrado={cargarDatos}
      />

      {/* ─── MODAL PARA PREVISUALIZAR COMPROBANTE / CAPTURA YAPE ─────────────── */}
      {comprobantePreviewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setComprobantePreviewUrl(null)}
        >
          <div 
            className="bg-surface border border-outline-variant rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-3">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Receipt className="h-4 w-4" /> {tituloPreviewModal}
              </span>
              <button
                onClick={() => setComprobantePreviewUrl(null)}
                className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/20 rounded-xl p-2 min-h-[300px]">
              {comprobantePreviewUrl.endsWith('.pdf') ? (
                <iframe src={comprobantePreviewUrl} className="w-full h-[500px] rounded-lg border-0" title="PDF" />
              ) : (
                <img src={comprobantePreviewUrl} alt="Comprobante" className="max-h-[500px] w-auto object-contain rounded-lg shadow" />
              )}
            </div>

            <div className="pt-3 flex justify-between items-center text-xs">
              <a
                href={comprobantePreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir en pestaña completa
              </a>
              <button
                onClick={() => setComprobantePreviewUrl(null)}
                className="px-4 py-1.5 bg-surface-container-high hover:bg-outline-variant font-bold rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
