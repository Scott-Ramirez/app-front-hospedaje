import { api } from '../adapters/api.adapter';

export interface Actividad {
  id: string;
  usuario: string;
  accion: string;
  descripcion: string;
  fecha: string;
}

export interface Gasto {
  id: string;
  usuario: string;
  monto: number;
  concepto: string;
  fecha: string;
}

export const bitacoraRepository = {
  listarActividades: async (): Promise<Actividad[]> => {
    const { data } = await api.get<Actividad[]>('/bitacora/actividades');
    return data;
  },

  listarGastos: async (): Promise<Gasto[]> => {
    const { data } = await api.get<Gasto[]>('/bitacora/gastos');
    return data;
  },

  registrarGasto: async (dto: { monto: number; concepto: string }): Promise<Gasto> => {
    const { data } = await api.post<Gasto>('/bitacora/gastos', dto);
    return data;
  },
};
