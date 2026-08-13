// 🌟 Importamos la constante con nombre exacta de tu archivo
import { api } from '../adapters/api.adapter';

// Definimos las interfaces de los DTOs basados exactamente en tu backend
export interface RegistroInicialDto {
  nombre: string;
  dni: string;
  celular?: string;
  habitacionId: string;
  total_pagar: number;
  fecha_salida_programada: string; // ISO String
  pago_inicial?: number;
  metodo_pago?: string;
}

export interface EstanciaResponse {
  id: string;
  huespedId: string;
  habitacionId: string;
  fecha_entrada: string;
  fecha_salida_programada: string;
  fecha_salida_real: string | null;
  total_pagar: number;
  estado: 'pendiente' | 'pagado' | 'finalizado';
  createdAt: string;
  updatedAt: string;
  diasTranscurridos?: number;
  montoAcumulado?: number;
  estaVencida?: boolean;
  huesped?: {
    id: string;
    nombre: string;
    dni: string;
    celular?: string;
  };
  habitacion?: {
    id: string;
    numero: string;
    piso?: number;
    tipo: string;
    estado: string;
    precio?: number;
  };
}

export const estanciasRepository = {
  /**
   * Obtiene la lista de estancias activas filtrando opcionalmente por estado.
   * Conecta con GET /estancias
   */
  async listar(estado?: string, page: number = 1): Promise<{ data: EstanciaResponse[]; total: number }> {
    const params: any = { page };
    if (estado) params.estado = estado;

    // 🌟 Usamos 'api' en lugar de 'apiAdapter'
    const response = await api.get<EstanciaResponse[]>('/estancias', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    
    // Paginación inteligente ficticia ya que la API retorna array plano
    const total = data.length === 5 ? (page * 5 + 1) : ((page - 1) * 5 + data.length);

    return {
      data,
      total
    };
  },

  /**
   * Ejecuta el proceso de Check-in Atómico creando huésped y estancia.
   * Conecta con POST /estancias/check-in-nuevo
   */
  async checkIn(datos: RegistroInicialDto): Promise<EstanciaResponse> {
    // 🌟 Usamos 'api'
    const response = await api.post('/estancias/check-in-nuevo', datos);
    return response.data;
  },

  /**
   * Procesa la salida física y liberación de la habitación.
   * Conecta con PATCH /estancias/:id/check-out
   */
  async checkOut(id: string): Promise<EstanciaResponse> {
    // 🌟 Usamos 'api'
    const response = await api.patch(`/estancias/${id}/check-out`);
    return response.data;
  },

  /**
   * Obtiene el saldo o deuda pendiente de una estancia.
   */
  async obtenerDeuda(id: string): Promise<{ deuda: number; totalCargos: number; totalPagos: number; pagos?: any[] }> {
    const response = await api.get<{ deuda: number; totalCargos: number; totalPagos: number; pagos?: any[] }>(`/estancias/${id}/deuda`);
    return response.data;
  },

  async obtenerPorId(id: string): Promise<EstanciaResponse> {
    const response = await api.get<EstanciaResponse>(`/estancias/${id}`);
    return response.data;
  },

  /**
   * Registra un pago de abono para liquidar la deuda de una estancia.
   */
  async registrarPago(id: string, datos: { monto: number; metodoPago: string; concepto?: string }): Promise<any> {
    const response = await api.post(`/estancias/${id}/pago`, datos);
    return response.data;
  }
};