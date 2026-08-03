// src/data/repositories/habitaciones.repository.ts
import { api } from '../adapters/api.adapter';

// ===== INTERFACES DEL DASHBOARD =====
export interface DashboardData {
  disponibles: any[];
  ocupadas: any[];
  limpieza: any[];
  resumen: {
    habitacionesDisponibles: number;
    habitacionesOcupadas: number;
    habitacionesEnLimpieza: number;
    totalHabitaciones: number;
  };
}

// ===== INTERFACE PARA EL CRUD DE HABITACIONES =====
export interface HabitacionDTO {
  id?: string;
  numero: string;
  tipo: 'simple' | 'matrimonial';
  aire_acondicionado: boolean;
  wifi: boolean;
  ventilador: boolean;
  precio: number;
  estado?: 'disponible' | 'ocupado' | 'limpieza';
  createdAt?: string;
  updatedAt?: string;
}

export class HabitacionesRepository {
  
  /**
   * Obtiene la información analítica y alertas para el Dashboard principal.
   */
  async getDashboardData(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('habitaciones/dashboard');
    return data;
  }

  // =========================================================================
  // MÉTODOS PARA EL CRUD DE INVENTARIO
  // =========================================================================

  /**
   * Trae la lista completa de todas las habitaciones del hospedaje.
   */
  async listarTodas(): Promise<HabitacionDTO[]> {
    const { data } = await api.get<HabitacionDTO[]>('habitaciones');
    return data;
  }

  /**
   * Registra un nuevo cuarto físico en el sistema.
   */
  async crear(datos: HabitacionDTO): Promise<HabitacionDTO> {
    const { data } = await api.post<HabitacionDTO>('habitaciones', datos);
    return data;
  }

  /**
   * Actualiza las propiedades físicas o tarifas de una habitación específica.
   */
  async actualizar(id: string, datos: Partial<HabitacionDTO>): Promise<HabitacionDTO> {
    const { data } = await api.patch<HabitacionDTO>(`habitaciones/${id.trim()}`, datos);
    return data;
  }

  /**
   * Elimina de forma definitiva una habitación por su ID.
   */
  async eliminar(id: string): Promise<void> {
    await api.delete(`habitaciones/${id.trim()}`);
  }

  /**
   * 🌟 NUEVO: Cambia el estado operativo de una habitación a 'disponible'
   */
  async liberar(id: string): Promise<HabitacionDTO> {
    const { data } = await api.patch<HabitacionDTO>(`habitaciones/${id.trim()}/liberar`);
    return data;
  }
}