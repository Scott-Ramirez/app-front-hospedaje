// src/data/repositories/historial.repository.ts
import { api } from '../adapters/api.adapter';

export interface HistorialRegistroDTO {
  id: string;
  habitacionNumero: string;
  habitacionPrecioBase: number; // 🌟 NUEVO: Agregado para soportar el precio base en el frontend
  huespedNombre: string;
  huespedDni: string;
  fechaEntrada: string; // ISO string de la base de datos
  fechaSalida: string;  // ISO string de la base de datos
  montoTotalPagado: number;
}

export interface HistorialMetaDTO {
  totalRegistros: number;
  paginaActual: number;
  paginasTotales: number;
}

export interface HistorialResponse {
  data: HistorialRegistroDTO[];
  meta: HistorialMetaDTO;
}

export class HistorialRepository {
  /**
   * Obtiene el listado histórico paginado y filtrado desde el backend.
   */
  async obtenerHistorial(params?: { termino?: string; pagina?: number }): Promise<HistorialResponse> {
    const { data } = await api.get<HistorialResponse>('estancias/historial-salidas', { 
      params: {
        termino: params?.termino || undefined,
        pagina: params?.pagina || 1
      } 
    });
    return data;
  }
}
