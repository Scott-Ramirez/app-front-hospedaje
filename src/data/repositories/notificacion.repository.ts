import { api } from '../adapters/api.adapter';

export interface NotificacionItem {
  id: string;
  remitenteId?: string;
  remitenteNombre: string;
  remitenteRol: string;
  destinatarioRol: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  habitacionNumero?: string;
  estanciaId?: string;
  leido: boolean;
  fecha: string;
}

export interface EnviarNotificacionDto {
  destinatarioRol: 'admin' | 'supervisor' | 'todos';
  titulo: string;
  mensaje: string;
  tipo?: string;
  habitacionNumero?: string;
  estanciaId?: string;
}

export const notificacionRepository = {
  async enviar(dto: EnviarNotificacionDto): Promise<NotificacionItem> {
    const response = await api.post<NotificacionItem>('/notificaciones', dto);
    return response.data;
  },

  async listar(): Promise<NotificacionItem[]> {
    const response = await api.get<NotificacionItem[]>('/notificaciones');
    return response.data;
  },

  async marcarLeida(id: string): Promise<void> {
    await api.patch(`/notificaciones/${id}/leer`);
  },

  async limpiar(): Promise<void> {
    await api.delete('/notificaciones/limpiar');
  },
};
