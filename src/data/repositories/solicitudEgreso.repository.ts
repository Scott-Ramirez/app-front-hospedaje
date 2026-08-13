import { api } from '../adapters/api.adapter';

export interface SolicitudEgreso {
  id: string;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;                  // Monto estimado
  montoReal?: number;             // Monto real liquidado
  concepto: string;
  descripcion?: string;
  imagenUrl?: string;             // Boleta inicial (opcional)
  boletaLiquidacionUrl?: string;  // Boleta de liquidación
  estado: 'pendiente' | 'pre_aprobado' | 'liquidado' | 'rechazado' | 'aprobado';
  aprobadoPorNombre?: string;
  motivoRechazo?: string;
  sesionCajaId?: string;
  fecha: string;
  fechaResolucion?: string;
  fechaLiquidacion?: string;
}

export const solicitudEgresoRepository = {
  // Paso 1 — Recepcionista crea solicitud (boleta opcional)
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

  // Paso 1b — Admin/Supervisor pre-aprueba (no descuenta caja)
  async preAprobar(id: string, observaciones?: string): Promise<void> {
    await api.patch(`/solicitudes-egreso/${id}/pre-aprobar`, { observaciones });
  },

  // Paso 2a — Recepcionista adjunta boleta + monto real
  async adjuntarBoleta(id: string, formData: FormData): Promise<SolicitudEgreso> {
    const { data } = await api.patch<SolicitudEgreso>(
      `/solicitudes-egreso/${id}/adjuntar-boleta`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  // Paso 2b — Admin/Supervisor liquida → descuenta caja
  async liquidar(id: string, formData: FormData): Promise<void> {
    await api.patch(`/solicitudes-egreso/${id}/liquidar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Rechazar en cualquier etapa
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
