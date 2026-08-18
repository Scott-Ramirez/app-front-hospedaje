import { api } from '../adapters/api.adapter';

export interface ReservaDTO {
  id?: string;
  habitacionId: string;
  huespedId?: string;
  habitacion?: any;
  huesped?: any;
  nombre?: string;
  dni?: string;
  celular?: string;
  fecha_inicio: string;
  fecha_fin: string;
  monto_adelanto: number;
  metodo_pago: 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';
  monto_total_estimado?: number;
  comprobante_url?: string;
  estado?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ReservasRepository {
  async listarTodas(): Promise<ReservaDTO[]> {
    const { data } = await api.get<ReservaDTO[]>('reservas');
    return Array.isArray(data) ? data : [];
  }

  async listarProximas(): Promise<ReservaDTO[]> {
    const { data } = await api.get<ReservaDTO[]>('reservas/proximas');
    return Array.isArray(data) ? data : [];
  }

  async subirComprobante(formData: FormData): Promise<{ comprobante_url: string }> {
    const { data } = await api.post<{ comprobante_url: string }>('reservas/upload-comprobante', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  getComprobanteUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const filename = url.replace(/^(\/)?uploads\/pagos\//, '');
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
    return `${apiBase}/reservas/comprobante/${filename}`;
  }

  async crear(datos: ReservaDTO): Promise<ReservaDTO> {
    const { data } = await api.post<ReservaDTO>('reservas', datos);
    return data;
  }

  async cancelar(id: string): Promise<void> {
    await api.patch(`reservas/${id}/cancelar`);
  }

  async procesarCheckIn(id: string, sesionCajaId?: string): Promise<any> {
    const { data } = await api.post(`reservas/${id}/checkin`, { sesionCajaId });
    return data;
  }
}
