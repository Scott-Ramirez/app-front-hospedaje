import { api } from '../adapters/api.adapter';

export interface ConfiguracionDTO {
  llave: string;
  valor: string;
}

export interface ConfiguracionResponse {
  mensaje: string;
  llave: string;
  nuevoValor: string;
}

export class ConfiguracionesRepository {
  /**
   * Obtiene la lista completa de configuraciones globales.
   */
  async listar(): Promise<ConfiguracionDTO[]> {
    const { data } = await api.get<ConfiguracionDTO[]>('/configuraciones');
    return data;
  }

  /**
   * Actualiza el valor de una configuración por su llave única.
   */
  async actualizar(llave: string, valor: string): Promise<ConfiguracionResponse> {
    const { data } = await api.patch<ConfiguracionResponse>(`/configuraciones/${llave}`, {
      valor,
    });
    return data;
  }
}
