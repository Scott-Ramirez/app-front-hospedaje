import { useState, useEffect } from 'react';
import { ReservasRepository } from '../../data/repositories/reservas.repository';
import type { ReservaDTO } from '../../data/repositories/reservas.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

const reservasRepo = new ReservasRepository();

export const useReservas = () => {
  const [reservas, setReservas] = useState<ReservaDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [modalCrearAbierto, setModalCrearAbierto] = useState<boolean>(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<any | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaDTO | null>(null);

  const cargarReservas = async () => {
    try {
      setCargando(true);
      const data = await reservasRepo.listarTodas();
      setReservas(data);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  const abrirModalCrear = (habitacion?: any) => {
    setHabitacionSeleccionada(habitacion || null);
    setModalCrearAbierto(true);
  };

  const cerrarModalCrear = () => {
    setModalCrearAbierto(false);
    setHabitacionSeleccionada(null);
  };

  const abrirModalDetalle = (reserva: ReservaDTO) => {
    setReservaSeleccionada(reserva);
    setModalDetalleAbierto(true);
  };

  const cerrarModalDetalle = () => {
    setModalDetalleAbierto(false);
    setReservaSeleccionada(null);
  };

  const handleCrearReserva = async (payload: ReservaDTO) => {
    try {
      await reservasRepo.crear(payload);
      AlertAdapter.toast('Reserva confirmada con éxito', 'success');
      cerrarModalCrear();
      cargarReservas();
    } catch (err: any) {
      console.error('Error al crear reserva:', err);
      const msg = err?.response?.data?.message || 'No se pudo registrar la reserva.';
      AlertAdapter.error('Error en Reserva', msg);
    }
  };

  const handleCancelarReserva = async (id: string) => {
    const confirmado = await AlertAdapter.confirm(
      '¿Cancelar Reserva?',
      'La reserva cambiará a estado cancelada y la fecha quedará liberada.',
    );

    if (confirmado) {
      try {
        await reservasRepo.cancelar(id);
        AlertAdapter.toast('Reserva cancelada correctamente', 'info');
        cerrarModalDetalle();
        cargarReservas();
      } catch (err: any) {
        console.error('Error al cancelar reserva:', err);
        AlertAdapter.error('Error', 'No se pudo cancelar la reserva.');
      }
    }
  };

  const handleCheckInReserva = async (id: string) => {
    const confirmado = await AlertAdapter.confirm(
      '¿Procesar Check-In?',
      'Se registrará el ingreso formal del huésped en la habitación a partir de esta reserva.',
    );

    if (confirmado) {
      try {
        await reservasRepo.procesarCheckIn(id);
        AlertAdapter.toast('Check-In registrado exitosamente', 'success');
        cerrarModalDetalle();
        cargarReservas();
      } catch (err: any) {
        console.error('Error en Check-In de reserva:', err);
        const msg = err?.response?.data?.message || 'No se pudo procesar el Check-In.';
        AlertAdapter.error('Error', msg);
      }
    }
  };

  const reservasFiltradas = reservas.filter((r: ReservaDTO) => {
    const term = busqueda.toLowerCase();
    const habNum = r.habitacion?.numero || '';
    const huespedNombre = r.huesped?.nombre || '';
    const huespedDni = r.huesped?.dni || '';

    return (
      habNum.toLowerCase().includes(term) ||
      huespedNombre.toLowerCase().includes(term) ||
      huespedDni.toLowerCase().includes(term)
    );
  });

  return {
    reservas: reservasFiltradas,
    todasReservas: reservas,
    cargando,
    busqueda,
    setBusqueda,
    modalCrearAbierto,
    modalDetalleAbierto,
    habitacionSeleccionada,
    reservaSeleccionada,
    abrirModalCrear,
    cerrarModalCrear,
    abrirModalDetalle,
    cerrarModalDetalle,
    handleCrearReserva,
    handleCancelarReserva,
    handleCheckInReserva,
    cargarReservas,
  };
};
