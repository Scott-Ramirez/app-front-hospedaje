import { useState, useEffect, useCallback } from 'react';
import { huespedesRepository } from '../../data/repositories/huespedes.repository';
import type { Huesped, CreateHuespedDto } from '../../data/repositories/huespedes.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

interface HuespedFormState {
  nombre: string;
  dni: string;
  celular: string;
}

const formInicial: HuespedFormState = {
  nombre: '',
  dni: '',
  celular: ''
};

export const useHuespedes = () => {
  // Estados base de datos
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // 🌟 Estado dedicado para las métricas reales del Backend
  const [metrics, setMetrics] = useState({
    activos: 0,
    historicos: 0,
    total: 0
  });

  // Estados de UI para el Modal y Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<HuespedFormState>(formInicial);

  const normalizarHuespedes = (data: any): Huesped[] => {
    if (data && !Array.isArray(data) && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  };

  /**
   * 4. Cargar Huéspedes y Métricas en paralelo (Check-in real)
   */
  const cargarHuespedes = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      
      // 🔄 Ejecutamos ambas promesas al mismo tiempo para no bloquear el hilo de renderizado
      const [dataHuespedes, dataMetricas] = await Promise.all([
        huespedesRepository.listar(),
        huespedesRepository.metricas() // <-- Llama al nuevo endpoint GET /huespedes/metricas
      ]);

      setHuespedes(normalizarHuespedes(dataHuespedes));
      setMetrics(dataMetricas);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor de huéspedes');
    } finally {
      setCargando(false);
    }
  }, []);

  // 5. Debounce para la barra de búsqueda remota
  useEffect(() => {
    if (!busqueda.trim()) {
      cargarHuespedes();
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setCargando(true);
        const data = await huespedesRepository.buscar(busqueda);
        setHuespedes(normalizarHuespedes(data));
        // NOTA: No alteramos el estado 'metrics' aquí para mantener los totales del hotel estables
      } catch (err: any) {
        setError('Error al filtrar la lista de huéspedes');
      } finally {
        setCargando(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [busqueda, cargarHuespedes]);

  // 6. Manejadores de eventos de la Vista (UI Click)
  const handleNuevoClick = () => {
    setEditandoId(null);
    setForm(formInicial);
    setModalAbierto(true);
  };

  const handleEditarClick = (guest: Huesped) => {
    setEditandoId(guest.id);
    setForm({
      nombre: guest.nombre,
      dni: guest.dni,
      celular: guest.celular || ''
    });
    setModalAbierto(true);
  };

  // 7. Guardar (Crea o Actualiza según el estado de editandoId)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCargando(true);
      setError(null);

      const payload: CreateHuespedDto = {
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
      };

      if (form.celular && form.celular.trim().length > 0) {
        payload.celular = form.celular.trim();
      }

      if (editandoId) {
        // Ejecuta PATCH en NestJS
        const actualizado = await huespedesRepository.actualizar(editandoId, payload);
        setHuespedes((prev) => {
          const list = normalizarHuespedes(prev);
          return list.map((h) => (h.id === editandoId ? actualizado : h));
        });
        AlertAdapter.toast('Datos del huésped actualizados correctamente', 'success');
      } else {
        // Ejecuta POST en NestJS
        const nuevo = await huespedesRepository.crear(payload);
        setHuespedes((prev) => {
          const list = normalizarHuespedes(prev);
          return [nuevo, ...list];
        });
        AlertAdapter.toast('Huésped registrado con éxito', 'success');
      }
      
      setModalAbierto(false);
      setForm(formInicial);
      setEditandoId(null);
      
      // 🔥 Refrescamos métricas y lista completa fresca desde el backend
      await Promise.all([
        huespedesRepository.metricas().then(setMetrics).catch(() => {}),
        cargarHuespedes()
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const errorStr = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar la ficha del huésped';
      setError(errorStr);
      AlertAdapter.error('Error al Guardar', errorStr);
    } finally {
      setCargando(false);
    }
  };

  // 8. Eliminar Registro
  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este huésped del historial?')) return;
    try {
      setCargando(true);
      await huespedesRepository.eliminar(id);
      setHuespedes((prev) => {
        const list = normalizarHuespedes(prev);
        return list.filter((h) => h.id !== id);
      });
      
      // 🔥 Volvemos a pedir métricas actualizadas tras una baja física/lógica
      const nuevasMetricas = await huespedesRepository.metricas();
      setMetrics(nuevasMetricas);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo eliminar el registro');
    } finally {
      setCargando(false);
    }
  };

  // Pasamos los huéspedes mapeados directamente desde el flujo controlado del backend
  const huespedesFiltrados = normalizarHuespedes(huespedes);

  return {
    cargando,
    error,
    busqueda,
    setBusqueda,
    modalAbierto,
    setModalAbierto,
    editandoId,
    form,
    setForm,
    metrics, // <-- Devuelve el state vivo { activos: 2, historicos: 5, total: 7 }
    huespedesFiltrados,
    handleNuevoClick,
    handleEditarClick,
    handleGuardar,
    handleEliminar,
    cargarHuespedes
  };
};