import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useCajaSesion } from '../context/CajaSesionContext';
import { Loader2, RefreshCw, Gamepad2 } from 'lucide-react';
import { GeneralDashboardView } from '../components/dashboard/GeneralDashboardView';
import { SupervisorDashboardView } from '../components/dashboard/SupervisorDashboardView';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import { RayzaRunnerModal } from '../components/dashboard/RayzaRunnerModal';

export const Dashboard: React.FC = () => {
  const {
    usuario,
    data,
    loading,
    porcentajeOcupacion,
    cargarDashboard
  } = useDashboard();
  
  const { verificarCaja } = useCajaSesion();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);

  useEffect(() => {
    verificarCaja(true);
  }, [verificarCaja]);

  const handleManualRefresh = async () => {
    setIsReconnecting(true);
    await Promise.all([
      cargarDashboard(),
      verificarCaja(true)
    ]);
    setIsReconnecting(false);
  };

  if (loading && !isReconnecting) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute h-2 w-2 bg-primary rounded-full" />
        </div>
        <p className="text-sm font-medium text-on-surface-variant animate-pulse">
          Sincronizando disponibilidad del hospedaje...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full text-on-surface space-y-6 select-none">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-on-surface">
            {usuario?.rol === 'admin' 
              ? 'Panel del Administrador' 
              : usuario?.rol === 'supervisor' 
              ? 'Consola del Supervisor' 
              : 'Panel de Control'}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
            {usuario?.rol === 'admin' 
              ? 'Supervisión integral de finanzas, bitácoras y estado operativo.' 
              : usuario?.rol === 'supervisor'
              ? 'Monitoreo de actividades de recepción, auditoría de egresos y control de habitaciones.'
              : 'Estado operativo e infraestructura en tiempo real.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botón de Pausa Activa / Rayza Runner */}
          <button 
            onClick={() => setIsGameOpen(true)}
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high active:scale-95 text-on-surface-variant hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-outline-variant/60 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Pausa Activa (Rayza Runner) - Presiona Esc para salir en cualquier momento"
          >
            <Gamepad2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 
            <span className="hidden sm:inline">Modo Relax</span>
          </button>

          {/* Botón de Actualizar Estado */}
          <button 
            onClick={handleManualRefresh}
            disabled={isReconnecting}
            className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-high active:scale-95 text-on-surface-variant hover:text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant/60 shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${isReconnecting ? 'animate-spin' : ''}`} /> 
            <span>Actualizar Estado</span>
          </button>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL DE LA VISTA SEGÚN EL ROL DE SEGURIDAD */}
      {usuario?.rol === 'admin' ? (
        <AdminDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      ) : usuario?.rol === 'supervisor' ? (
        <SupervisorDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      ) : (
        <GeneralDashboardView 
          data={data}
          porcentajeOcupacion={porcentajeOcupacion}
        />
      )}

      {/* MODAL DE PAUSA ACTIVA / RAYZA RUNNER */}
      <RayzaRunnerModal
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />

    </div>
  );
};

export default Dashboard;