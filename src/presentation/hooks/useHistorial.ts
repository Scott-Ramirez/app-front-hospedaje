// src/presentation/hooks/useHistorial.ts
import { useState, useEffect } from 'react';
import { HistorialRepository } from '../../data/repositories/historial.repository';
import type { HistorialRegistroDTO, HistorialMetaDTO } from '../../data/repositories/historial.repository';

const historialRepo = new HistorialRepository();

export const useHistorial = () => {
  const [registros, setRegistros] = useState<HistorialRegistroDTO[]>([]);
  const [meta, setMeta] = useState<HistorialMetaDTO>({ totalRegistros: 0, paginaActual: 1, paginasTotales: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false); // 🌟 NUEVO: Estado para búsquedas silenciosas
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState<number>(1);

  const cargarHistorial = async (terminoBusqueda: string, pagina: number, silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      } else {
        setIsSearching(true); // Evita activar el loading global que desmonta la tabla
      }
      
      setError(null);
      const response = await historialRepo.obtenerHistorial({
        termino: terminoBusqueda,
        pagina: pagina
      });
      
      setRegistros(response.data || []);
      
      // Confiamos directamente en el meta que procesa el backend con la sumatoria real de la BD
      if (response.meta) {
        setMeta(response.meta);
      } else {
        setMeta({
          totalRegistros: response.data?.length || 0,
          paginaActual: pagina,
          paginasTotales: 1
        });
      }

    } catch (err: any) {
      console.error('Error al solicitar registros históricos:', err);
      setError(err?.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Efecto reactivo ante cambios de búsqueda (con debounce) o de página
  useEffect(() => {
    // Si ya hay datos o se está escribiendo, hacemos una petición "silenciosa" en background
    const esSilencioso = registros.length > 0 || busqueda.length > 0;

    const delayDebounce = setTimeout(() => {
      cargarHistorial(busqueda, paginaActual, esSilencioso);
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [busqueda, paginaActual]);

  // Si cambia la búsqueda, reseteamos preventivamente a la página 1
  const manejarCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  // Cálculo dinámico para la sección Bento (Suma de montos totales pagados)
  const ingresosTotalesCalculados = registros.reduce((sum, item) => sum + (item.montoTotalPagado || 0), 0);

  // Generación de un set de tendencias simuladas en base a la longitud de los registros para el minigráfico bento
  const tendenciaOcupacionCalculada = registros.length > 0 
    ? registros.map(r => Math.min((r.montoTotalPagado * 100) / 100, 100)).reverse()
    : [20, 40, 30, 70, 50];

  const limpiarFiltros = () => {
    setBusqueda('');
    setPaginaActual(1);
  };

  return {
    registros,
    meta,
    loading,
    isSearching, // 🌟 Exportamos para que la vista lo use
    error,
    busqueda,
    setBusqueda: manejarCambioBusqueda,
    paginaActual,
    setPaginaActual,
    ingresosTotalesCalculados,
    tendenciaOcupacionCalculada,
    limpiarFiltros,
    recargar: () => cargarHistorial(busqueda, paginaActual, false)
  };
};