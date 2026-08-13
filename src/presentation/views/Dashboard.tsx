import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useCajaSesion } from '../context/CajaSesionContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { GeneralDashboardView } from '../components/dashboard/GeneralDashboardView';
import { SupervisorDashboardView } from '../components/dashboard/SupervisorDashboardView';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';

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
    <div className="p-6 max-w-[1280px] mx-auto text-on-surface space-y-8 select-none">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            {usuario?.rol === 'admin' 
              ? 'Panel del Administrador' 
              : usuario?.rol === 'supervisor' 
              ? 'Consola del Supervisor' 
              : 'Panel de Control'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {usuario?.rol === 'admin' 
              ? 'Supervisión integral de finanzas, bitácoras y estado operativo.' 
              : usuario?.rol === 'supervisor'
              ? 'Monitoreo de actividades de recepción, auditoría de egresos y control de habitaciones.'
              : 'Estado operativo e infraestructura en tiempo real.'}
          </p>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isReconnecting}
          className="inline-flex items-center gap-2 bg-surface-lowest hover:bg-surface-container-low text-on-surface-variant text-xs font-bold px-4 py-2.5 rounded-lg border border-outline-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`} /> 
          Actualizar Estado
        </button>
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

    </div>
  );
};

export default Dashboard;