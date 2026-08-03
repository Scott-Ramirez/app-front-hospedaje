import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCajaSesion } from '../../context/CajaSesionContext';
import { AperturaCajaState } from '../shared/AperturaCajaState';
import { Loader2 } from 'lucide-react';

interface CajaGuardProps {
  children: React.ReactNode;
}

export const CajaGuard: React.FC<CajaGuardProps> = ({ children }) => {
  const { usuario } = useAuth();
  const { cajaActiva, loadingCaja } = useCajaSesion();

  if (loadingCaja) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-on-surface-variant animate-pulse">Sincronizando estado de caja...</p>
      </div>
    );
  }

  // Si el rol es recepcionista y no hay caja abierta, bloquea la interfaz
  if (usuario?.rol === 'recepcionista' && !cajaActiva) {
    return <AperturaCajaState />;
  }

  return <>{children}</>;
};
