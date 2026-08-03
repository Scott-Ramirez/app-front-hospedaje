import { useState, useEffect, useCallback } from 'react';
// 🌟 Corrección 1: Separamos el repositorio de sus tipos/interfaces usando 'import type'
import { estanciasRepository } from '../../data/repositories/estancias.repository';
import type { EstanciaResponse, RegistroInicialDto } from '../../data/repositories/estancias.repository';

// 🌟 Corrección 2: Importamos la clase u objeto con el nombre correcto exacto
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import { useCajaSesion } from '../context/CajaSesionContext';

export const useEstancias = (estadoInicial?: string) => {
  const { verificarCaja } = useCajaSesion();
  const [estancias, setEstancias] = useState<EstanciaResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(estadoInicial);

  // Carga reactiva de estancias de la API
  const cargarEstancias = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await estanciasRepository.listar(filtroEstado, paginaActual);
      setEstancias(resultado.data);
      setTotalItems(resultado.total);
    } catch (error: any) {
      console.error('Error cargando estancias:', error);
      // 🌟 Corrección 2: Cambiado a AlertAdapter
      AlertAdapter.error('No se pudo obtener el listado de estancias activas');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, paginaActual]);

  // Ejecutar recarga al cambiar filtros o página
  useEffect(() => {
    cargarEstancias();
  }, [cargarEstancias]);

  /**
   * Orquesta la llamada de registro y refresca la UI si sale bien
   */
  const registrarCheckIn = async (datos: RegistroInicialDto): Promise<boolean> => {
    setLoading(true);
    try {
      await estanciasRepository.checkIn(datos);
      // 🌟 Corrección 2: Cambiado a AlertAdapter
      AlertAdapter.success('Check-In registrado exitosamente');
      await cargarEstancias(); // Refrescamos el listado operativo del hotel inmediatamente
      await verificarCaja(true); // Sincronizar caja
      return true;
    } catch (error: any) {
      console.error('Error en Check-In:', error);
      const mensaje = error.response?.data?.message || 'Error al procesar el ingreso';
      // 🌟 Corrección 2: Cambiado a AlertAdapter
      AlertAdapter.error(mensaje);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ejecuta el cierre de la estancia con una confirmación visual previa
   */
  const procesarCheckOut = async (id: string, numeroHabitacion: string) => {
    const seguro = window.confirm(`¿Está seguro de finalizar la estancia de la Habitación ${numeroHabitacion} y proceder con la liberación?`);
    if (!seguro) return;

    setLoading(true);
    try {
      await estanciasRepository.checkOut(id);
      // 🌟 Corrección 2: Cambiado a AlertAdapter
      AlertAdapter.success(`Habitación ${numeroHabitacion} liberada con éxito.`);
      await cargarEstancias(); // Refresca las habitaciones activas restantes
      await verificarCaja(true); // Sincronizar caja
    } catch (error: any) {
      console.error('Error en Check-Out:', error);
      const mensaje = error.response?.data?.message || 'No se pudo finalizar la estancia';
      // 🌟 Corrección 2: Cambiado a AlertAdapter
      AlertAdapter.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return {
    estancias,
    loading,
    totalItems,
    paginaActual,
    setPaginaActual,
    filtroEstado,
    setFiltroEstado,
    registrarCheckIn,
    procesarCheckOut,
    recargar: cargarEstancias,
  };
};