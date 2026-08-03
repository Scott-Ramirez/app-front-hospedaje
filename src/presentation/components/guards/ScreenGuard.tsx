import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { useGlobalError } from '../../context/ErrorContext';
import { SessionExpiredState } from '../shared/SessionExpiredState';
import { ErrorState } from '../shared/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CambiarPasswordModal } from '../shared/CambiarPasswordModal';

export const ScreenGuard = ({ children }: { children: React.ReactNode }) => {
  // 🌟 Agregamos los hooks de control de errores y autenticación
  const { globalError, clearGlobalError } = useGlobalError();
  const { logout, debeChangiarPassword } = useAuth();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  // 🌟 Función auxiliar para evaluar el reintento de conexión
  const handleRetry = async () => {
    setIsRetrying(true);
    clearGlobalError();
    window.location.reload();
  };

  return (
    <>
      {/* 📱 1. MENSAJE PARA CELULARES (Pantallas menores a 768px) */}
      <div className="block md:hidden min-h-screen bg-background text-on-background px-6 py-12 transition-colors duration-300 print:hidden">
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-error-container text-error shadow-sm mb-6">
            <Smartphone className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-sans">
            Dispositivo No Autorizado
          </h2>
          <p className="mt-3 text-sm text-on-surface-variant max-w-xs leading-relaxed">
            Por seguridad y optimización del mostrador, el **Sistema de Hospedaje** no está habilitado para teléfonos móviles.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-wider">
            <Monitor className="h-4 w-4" /> Use una Laptop o PC de escritorio
          </div>
        </div>
      </div>

      {/* 📑 2. MENSAJE PARA TABLETS (Pantallas entre 768px y 1023px) */}
      <div className="hidden md:block lg:hidden min-h-screen bg-background text-on-background px-8 py-12 transition-colors duration-300 print:hidden">
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm mb-6">
            <Tablet className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-sans">
            Resolución Limitada
          </h2>
          <p className="mt-3 text-sm text-on-surface-variant max-w-sm leading-relaxed">
            Las dimensiones de su tableta no permiten desplegar la densidad de la matriz de habitaciones de forma fluida.
          </p>
          <p className="mt-2 text-xs text-outline">
            Por favor, amplíe la ventana o acceda desde la terminal de la recepción.
          </p>
        </div>
      </div>

      {/* 💻 3. CONTENIDO PARA PC / LAPTOPS (Pantallas de 1024px a más) */}
      <div className="hidden lg:block print:block">
        {debeChangiarPassword ? (
          <CambiarPasswordModal />
        ) : (
          (() => {
            // Si no hay errores, se despliega la interfaz con total normalidad
            if (!globalError) return children;

            // Interceptamos la sesión expirada
            if (globalError.type === 'auth') {
              const handleSessionRedirect = () => {
                logout();
                clearGlobalError();
                navigate('/login');
              };
              return <SessionExpiredState onRedirectToLogin={handleSessionRedirect} />;
            }

            // Interceptamos fallos del servidor o caídas de red
            return (
              <ErrorState 
                message={globalError.message} 
                onRetry={handleRetry} 
                isRetrying={isRetrying} 
              />
            );
        })())}
      </div>
    </>
  );
};