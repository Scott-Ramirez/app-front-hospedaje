import { api } from '../adapters/api.adapter'; // O la ruta donde tengas tu instancia de Axios

export interface Huesped {
  id: string;
  nombre: string;
  dni: string;
  celular?: string;
}

export interface CreateHuespedDto {
  nombre: string;
  dni: string;
  celular?: string;
}

// 🌟 Interfaz añadida para mantener el tipado estricto de las tarjetas
export interface HuespedMetricas {
  activos: number;
  historicos: number;
  total: number;
}

export const huespedesRepository = {
  /**
   * Obtiene la lista completa de huéspedes registrados.
   * GET /huespedes
   */
  listar: async (): Promise<Huesped[]> => {
    const response = await api.get<Huesped[]>('/huespedes');
    return response.data;
  },

  /**
   * 🌟 Obtiene el cálculo real de ocupación para los Bento Cards del Dashboard.
   * GET /huespedes/metricas
   */
  metricas: async (): Promise<HuespedMetricas> => {
    const response = await api.get<HuespedMetricas>('/huespedes/metricas');
    return response.data;
  },

  /**
   * Busca huéspedes de forma dinámica (por DNI o nombre).
   * GET /huespedes/buscar?q=...
   */
  buscar: async (q: string): Promise<Huesped[]> => {
    const response = await api.get<Huesped[]>('/huespedes/buscar', {
      params: { q }
    });
    return response.data;
  },

  /**
   * Registra un nuevo cliente en el sistema.
   * POST /huespedes
   */
  crear: async (dto: CreateHuespedDto): Promise<Huesped> => {
    const response = await api.post<Huesped>('/huespedes', dto);
    return response.data;
  },

  /**
   * Modifica los datos de un huésped existente.
   * PATCH /huespedes/:id
   */
  actualizar: async (id: string, dto: Partial<CreateHuespedDto>): Promise<Huesped> => {
    const response = await api.patch<Huesped>(`/huespedes/${id}`, dto);
    return response.data;
  },

  /**
   * Envía un huésped a la papelera (eliminación lógica).
   * DELETE /huespedes/:id
   */
  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/huespedes/${id}`);
  }
};