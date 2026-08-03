// src/presentation/hooks/useHabitaciones.ts
import { useState, useEffect } from 'react';
import { HabitacionesRepository } from '../../data/repositories/habitaciones.repository';
import type { HabitacionDTO } from '../../data/repositories/habitaciones.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

const habitacionesRepo = new HabitacionesRepository();

export const useHabitaciones = () => {
    const [habitaciones, setHabitaciones] = useState<HabitacionDTO[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState<string>('');

    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [form, setForm] = useState<HabitacionDTO>({
        numero: '',
        tipo: 'simple',
        aire_acondicionado: false,
        wifi: true,
        ventilador: false,
        precio: 0,
    });

    const cargarHabitaciones = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await habitacionesRepo.listarTodas();
            
            // Si el backend no tiene habitaciones registradas, devuelve un objeto descriptivo con data: []
            if (data && !Array.isArray(data) && Array.isArray((data as any).data)) {
                setHabitaciones((data as any).data);
            } else {
                setHabitaciones(Array.isArray(data) ? data : []);
            }
        } catch (err: any) {
            console.error('Error al obtener habitaciones:', err);
            setError(err?.message || 'Network Error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarHabitaciones();
    }, []);

    const habitacionesArr = Array.isArray(habitaciones) ? habitaciones : [];

    const metrics = {
        disponibles: habitacionesArr.filter(h => h.estado === 'disponible').length,
        ocupadas: habitacionesArr.filter(h => h.estado === 'ocupado').length,
        limpieza: habitacionesArr.filter(h => h.estado === 'limpieza').length,
        total: habitacionesArr.length
    };

    const handleNuevoClick = () => {
        setEditandoId(null);
        setForm({ numero: '', tipo: 'simple', aire_acondicionado: false, wifi: true, ventilador: false, precio: 0 });
        setModalAbierto(true);
    };

    const handleEditarClick = (habitacion: HabitacionDTO) => {
        setEditandoId(habitacion.id || null);
        setForm({ ...habitacion });
        setModalAbierto(true);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payloadNormatizado = {
                numero: String(form.numero).trim(),
                tipo: form.tipo,
                precio: Number(form.precio),
                aire_acondicionado: Boolean(form.aire_acondicionado),
                wifi: Boolean(form.wifi),
                ventilador: Boolean(form.ventilador)
            };

            if (editandoId) {
                await habitacionesRepo.actualizar(editandoId, payloadNormatizado);
                AlertAdapter.toast('Habitación actualizada con éxito', 'success');
            } else {
                await habitacionesRepo.crear(payloadNormatizado);
                AlertAdapter.toast('Habitación agregó con éxito', 'success');
            }
            setModalAbierto(false);
            cargarHabitaciones();
        } catch (err) {
            console.error('Error al guardar la habitación:', err);
            AlertAdapter.error('Error al guardar', 'Ocurrió un problema al procesar los datos.');
        }
    };

    const handleEliminar = async (id: string) => {
        const confirmado = await AlertAdapter.confirm(
            '¿Estás seguro de eliminar?',
            'Esta acción removerá permanentemente la habitación de la base de datos.'
        );

        if (confirmado) {
            try {
                await habitacionesRepo.eliminar(id);
                AlertAdapter.toast('Habitación eliminada correctamente', 'success');
                cargarHabitaciones();
            } catch (err: any) {
                console.error('Error al eliminar:', err);
                
                // 🌟 DETECCIÓN DE RESTRICCIÓN DE LLAVE FORÁNEA (Historial operativo en BD)
                const errorText = err?.response?.data?.message || err?.message || '';
                const status = err?.response?.status;
                
                const esPorHistorial = 
                    status === 500 || 
                    errorText.toLowerCase().includes('foreign key') || 
                    errorText.toLowerCase().includes('referenced');

                if (esPorHistorial) {
                    AlertAdapter.error(
                        'No se puede eliminar',
                        'Esta habitación cuenta con historial de estancias o alquileres registrados en el pasado. Para proteger la integridad de las auditorías de caja y reportes de huéspedes, el sistema impide su eliminación física.'
                    );
                } else {
                    AlertAdapter.error(
                        'Error al eliminar', 
                        'No se pudo quitar el registro debido a un inconveniente en el servidor.'
                    );
                }
            }
        }
    };

    /**
     * 🌟 NUEVO: Envía la orden de liberación al servidor para retornar el cuarto a 'disponible'
     */
    const handleLiberar = async (id: string, numero: string) => {
        const confirmado = await AlertAdapter.confirm(
            `¿Liberar Habitación ${numero}?`,
            'El estado del cuarto cambiará a disponible de inmediato para nuevas asignaciones.'
        );

        if (confirmado) {
            try {
                await habitacionesRepo.liberar(id);
                AlertAdapter.toast(`Habitación ${numero} liberada con éxito`, 'success');
                cargarHabitaciones();
            } catch (err) {
                console.error('Error al liberar habitación:', err);
                AlertAdapter.error('Error operativo', 'No se pudo procesar la liberación de la unidad.');
            }
        }
    };

    const habitacionesFiltradas = habitacionesArr.filter(h =>
        h.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        h.tipo.toLowerCase().includes(busqueda.toLowerCase())
    );

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
        metrics,
        habitaciones: habitacionesArr, // 🌟 Exportado para el modal de Check-In
        habitacionesFiltradas,
        handleNuevoClick,
        handleEditarClick,
        handleGuardar,
        handleEliminar,
        handleLiberar, // 🌟 Exportado
        cargarHabitaciones
    };
};