import { api } from '../adapters/api.adapter';

export interface CajaSesionResponse {
  id: string;
  usuarioId: number;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  monto_ingresos: number;
  monto_egresos: number;
  monto_real_entregado?: number | null;
  descuadre?: number | null;
  estado: 'abierta' | 'cerrada';
  observaciones?: string | null;
  usuario?: {
    id: number;
    username: string;
    nombre: string;
  };
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

  async cerrar(montoReal: number, observaciones?: string): Promise<CajaSesionResponse> {
    const { data } = await api.post<CajaSesionResponse>('/caja-sesiones/cerrar', { montoReal, observaciones });
    return data;
  },

  async obtenerHistorial(page = 1, limit = 10): Promise<{ data: CajaSesionResponse[]; total: number }> {
    const { data } = await api.get<{ data: CajaSesionResponse[]; total: number }>('/caja-sesiones/historial', {
      params: { page, limit }
    });
    return data;
  },

  async obtenerUltimoCierre(): Promise<number> {
    const { data } = await api.get<{ ultimoMontoCierre: number }>('/caja-sesiones/ultimo-cierre');
    return data.ultimoMontoCierre ?? 0;
  },

  async listarPagos(): Promise<any[]> {
    const { data } = await api.get<any[]>('/caja-sesiones/pagos');
    return data;
  }
};
