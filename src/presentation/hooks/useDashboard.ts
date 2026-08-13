// src/presentation/hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HabitacionesRepository } from '../../data/repositories/habitaciones.repository';
import { estanciasRepository } from '../../data/repositories/estancias.repository';

const habitacionesRepository = new HabitacionesRepository();

export interface HuespedPorDesocupar {
  estanciaId: string;
  habitacionNumero: string;
  huespedNombre: string;
  huespedDni?: string;
  fechaSalidaProgramada: string;
  montoPendienteAproximado: number;
  estaVencida: boolean;
}

export interface DashboardViewData {
  resumen: {
    habitacionesDisponibles: number;
    habitacionesOcupadas: number;
    habitacionesEnLimpieza: number;
    totalHabitaciones: number;
  };
  alertas: {
    totalVencidas: number;
    huespedesPorDesocupar: HuespedPorDesocupar[];
  };
}

export const useDashboard = () => {
    const { usuario } = useAuth();
    const [data, setData] = useState<DashboardViewData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const cargarDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [dashboardRes, estanciasRes] = await Promise.all([
                habitacionesRepository.getDashboardData(),
                estanciasRepository.listar('pendiente', 1)
            ]);

            const totalHab = (dashboardRes.resumen.habitacionesDisponibles || 0) + 
                             (dashboardRes.resumen.habitacionesOcupadas || 0) + 
                             (dashboardRes.resumen.habitacionesEnLimpieza || 0);

            const estanciasConEstado = estanciasRes.data.map((e: any) => {
                const precio = Number(e.habitacion?.precio || 0);
                const montoAcum = Number(e.montoAcumulado ?? 0);
                const pagado = Number(e.total_pagar || 0);
                // Calcular deuda pendiente igual que el backend: max(0, acum - pagado)
                const montoPendiente = Math.max(0, montoAcum - pagado);
                // Confiar en el backend para estaVencida — ya calcula correctamente
                // si el huésped está al día (pagó sus días programados → false)
                const estaVencida = Boolean(e.estaVencida) && montoPendiente > 0;
                return {
                    estanciaId: e.id,
                    habitacionNumero: e.habitacion?.numero || '---',
                    huespedNombre: e.huesped?.nombre || 'Huésped Anónimo',
                    huespedDni: e.huesped?.dni || '',
                    fechaSalidaProgramada: e.fecha_salida_programada,
                    montoPendienteAproximado: montoPendiente,
                    estaVencida,
                    precio
                };
            });

            const totalVencidas = estanciasConEstado.filter(e => e.estaVencida).length;

            setData({
                resumen: {
                    habitacionesDisponibles: dashboardRes.resumen.habitacionesDisponibles || 0,
                    habitacionesOcupadas: dashboardRes.resumen.habitacionesOcupadas || 0,
                    habitacionesEnLimpieza: dashboardRes.resumen.habitacionesEnLimpieza || 0,
                    totalHabitaciones: totalHab
                },
                alertas: {
                    totalVencidas,
                    huespedesPorDesocupar: estanciasConEstado
                }
            });
        } catch (err: any) {
            // Mapeo semántico de errores según principios de Clean Code
            const errorMessage = err?.message || '';
            const status = err?.response?.status;

            if (!window.navigator.onLine || errorMessage.toLowerCase().includes('network error')) {
                setError('No hay conexión con el servidor. Verifica tu señal de internet o el cable de red central.');
            } else if (status === 401 || status === 403) {
                setError('Tu sesión ha expirado o no tienes permisos suficientes para visualizar el panel de control.');
            } else if (status >= 500) {
                setError('El servidor central del hospedaje experimentó un problema interno. Intenta sincronizar nuevamente.');
            } else {
                setError('El sistema encontró un inconveniente al procesar y calcular los datos de las habitaciones.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDashboard();
    }, []);

    // Cálculo matemático en caliente de tasa de ocupación
    const porcentajeOcupacion = data?.resumen && data.resumen.totalHabitaciones > 0
        ? Math.round((data.resumen.habitacionesOcupadas / data.resumen.totalHabitaciones) * 100)
        : 0;

    return {
        usuario,
        data,
        loading,
        error,
        porcentajeOcupacion,
        cargarDashboard
    };
};