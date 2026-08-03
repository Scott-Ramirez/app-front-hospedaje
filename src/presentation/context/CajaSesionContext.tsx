import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cajaSesionRepository } from '../../data/repositories/cajaSesion.repository';
import type { CajaSesionResponse } from '../../data/repositories/cajaSesion.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

interface CajaSesionContextProps {
  cajaActiva: CajaSesionResponse | null;
  loadingCaja: boolean;
  abrirCaja: (montoInicial: number) => Promise<boolean>;
  cerrarCaja: (montoReal: number, observaciones?: string) => Promise<boolean>;
  verificarCaja: (silencioso?: boolean) => Promise<void>;
}

const CajaSesionContext = createContext<CajaSesionContextProps | undefined>(undefined);

export const CajaSesionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, logout } = useAuth();
  const [cajaActiva, setCajaActiva] = useState<CajaSesionResponse | null>(null);
  const [loadingCaja, setLoadingCaja] = useState(true);

  const verificarCaja = useCallback(async (silencioso = false) => {
    if (!usuario) {
      setCajaActiva(null);
      setLoadingCaja(false);
      return;
    }

    try {
      if (!silencioso) {
        setLoadingCaja(true);
      }
      const activa = await cajaSesionRepository.obtenerActiva();
      setCajaActiva(activa);
    } catch (err) {
      console.error('Error al verificar caja activa:', err);
      setCajaActiva(null);
    } finally {
      if (!silencioso) {
        setLoadingCaja(false);
      }
    }
  }, [usuario]);

  useEffect(() => {
    verificarCaja();
  }, [usuario, verificarCaja]);

  const abrirCaja = async (montoInicial: number): Promise<boolean> => {
    try {
      setLoadingCaja(true);
      const nueva = await cajaSesionRepository.abrir(montoInicial);
      setCajaActiva(nueva);
      AlertAdapter.success('Caja Abierta', `Se abrió la caja con un saldo inicial de S/. ${Number(montoInicial).toFixed(2)}`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo abrir la caja.';
      AlertAdapter.error('Error al abrir caja', msg);
      return false;
    } finally {
      setLoadingCaja(false);
    }
  };

  const cerrarCaja = async (montoReal: number, observaciones?: string): Promise<boolean> => {
    try {
      setLoadingCaja(true);
      await cajaSesionRepository.cerrar(montoReal, observaciones);
      setCajaActiva(null);
      AlertAdapter.success('Caja Cerrada', 'La sesión del turno finalizó con éxito.');
      
      // Tras cerrar caja, forzamos el logout inmediato por seguridad y cambio de turno
      logout();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo cerrar la caja.';
      AlertAdapter.error('Error al cerrar caja', msg);
      return false;
    } finally {
      setLoadingCaja(false);
    }
  };

  return (
    <CajaSesionContext.Provider value={{ cajaActiva, loadingCaja, abrirCaja, cerrarCaja, verificarCaja }}>
      {children}
    </CajaSesionContext.Provider>
  );
};

export const useCajaSesion = () => {
  const context = useContext(CajaSesionContext);
  if (!context) {
    throw new Error('useCajaSesion debe ser usado dentro de un CajaSesionProvider');
  }
  return context;
};
