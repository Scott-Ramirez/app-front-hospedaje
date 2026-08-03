import { api } from '../adapters/api.adapter';

export interface SolicitudEgreso {
  id: string;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;
  concepto: string;
  descripcion?: string;
  imagenUrl?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  aprobadoPorNombre?: string;
  motivoRechazo?: string;
  sesionCajaId?: string;
  fecha: string;
  fechaResolucion?: string;
}

export const solicitudEgresoRepository = {
  async crear(formData: FormData): Promise<SolicitudEgreso> {
    const { data } = await api.post<SolicitudEgreso>('/solicitudes-egreso', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async listar(): Promise<SolicitudEgreso[]> {
    const { data } = await api.get<SolicitudEgreso[]>('/solicitudes-egreso');
    return data;
  },

  async aprobar(id: string, observaciones?: string): Promise<void> {
    await api.patch(`/solicitudes-egreso/${id}/aprobar`, { observaciones });
  },

  async rechazar(id: string, motivoRechazo?: string): Promise<void> {
    await api.patch(`/solicitudes-egreso/${id}/rechazar`, { motivoRechazo });
  },

  getImagenUrl(imagenUrl: string): string {
    if (!imagenUrl) return '';
    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
      return imagenUrl;
    }
    const filename = imagenUrl.split('/').pop() || '';
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return `${apiBase}/solicitudes-egreso/imagen/${filename}`;
  },
};
