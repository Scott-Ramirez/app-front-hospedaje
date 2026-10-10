import { api } from '../adapters/api.adapter';

export interface CajaSesionResponse {
  id: string;
  usuarioId: number;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  monto_ingresos: number;
  monto_ingresos_efectivo?: number;
  monto_ingresos_digital?: number;
  monto_egresos: number;
  monto_real_entregado?: number | null;
  monto_entregado_admin?: number | null;
  monto_dejado_caja?: number | null;
  descuadre?: number | null;
  estado: 'abierta' | 'cerrada';
  observaciones?: string | null;
  conciliado: boolean;
  conciliado_por?: string | null;
  notas_conciliacion?: string | null;
  usuario?: {
    id: number;
    username: string;
    nombre: string;
  };
}

export interface UltimoCierreInfo {
  ultimoMontoCierre: number;
  montoEntregadoAdmin: number;
  montoDejadoCaja: number;
  montoRealEntregado: number;
  tieneTurnoPrevio: boolean;
  nombreUsuarioCierre?: string;
  fechaCierre?: string;
}

export const cajaSesionRepository = {
  async abrir(montoInicial: number): Promise<CajaSesionResponse> {
    const { data } = await api.post<CajaSesionResponse>('/caja-sesiones/abrir', { montoInicial });
    return data;
  },

  async obtenerActiva(): Promise<CajaSesionResponse | null> {
    const { data } = await api.get<CajaSesionResponse | null>('/caja-sesiones/activa');
    return data;
  },

  async cerrar(
    montoReal: number, 
    observaciones?: string,
    montoEntregadoAdmin?: number,
    montoDejadoCaja?: number
  ): Promise<CajaSesionResponse> {
    const { data } = await api.post<CajaSesionResponse>('/caja-sesiones/cerrar', { 
      montoReal, 
      observaciones,
      montoEntregadoAdmin,
      montoDejadoCaja
    });
    return data;
  },

  async obtenerHistorial(page = 1, limit = 10): Promise<{ data: CajaSesionResponse[]; total: number }> {
    const { data } = await api.get<{ data: CajaSesionResponse[]; total: number }>('/caja-sesiones/historial', {
      params: { page, limit }
    });
    return data;
  },

  async obtenerUltimoCierre(): Promise<UltimoCierreInfo> {
    const { data } = await api.get<UltimoCierreInfo>('/caja-sesiones/ultimo-cierre');
    return data;
  },

  async listarPagos(): Promise<any[]> {
    const { data } = await api.get<any[]>('/caja-sesiones/pagos');
    return data;
  },

  async conciliar(id: string, notas: string): Promise<CajaSesionResponse> {
    const { data } = await api.patch<CajaSesionResponse>(`/caja-sesiones/${id}/conciliar`, { notas });
    return data;
  }
};
