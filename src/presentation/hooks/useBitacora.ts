import { useState, useEffect, useCallback } from 'react';
import { bitacoraRepository } from '../../data/repositories/bitacora.repository';
import type { Actividad, Gasto } from '../../data/repositories/bitacora.repository';
import { cajaSesionRepository } from '../../data/repositories/cajaSesion.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

export const useBitacora = () => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [act, gst, pgs] = await Promise.all([
        bitacoraRepository.listarActividades(),
        bitacoraRepository.listarGastos(),
        cajaSesionRepository.listarPagos().catch(() => []),
      ]);
      setActividades(act);
      setGastos(gst);
      setPagos(pgs);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al cargar bitácora');
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarGasto = async (monto: number, concepto: string) => {
    try {
      setLoading(true);
      const nuevoGasto = await bitacoraRepository.registrarGasto({ monto, concepto });
      setGastos((prev) => [nuevoGasto, ...prev]);
      
      // Volvemos a cargar las actividades ya que el gasto gatilla una actividad en el backend
      const act = await bitacoraRepository.listarActividades();
      setActividades(act);

      AlertAdapter.success('Gasto registrado', `Se retiró S/. ${Number(monto).toFixed(2)} correctamente.`);
      return true;
    } catch (err: any) {
      console.error(err);
      AlertAdapter.error('Error al registrar gasto', err?.response?.data?.message || 'No se pudo guardar el gasto.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  return {
    actividades,
    gastos,
    pagos,
    totalGastos,
    loading,
    error,
    registrarGasto,
    recargarBitacora: cargarDatos,
  };
};
