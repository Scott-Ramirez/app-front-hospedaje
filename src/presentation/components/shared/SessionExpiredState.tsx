import React, { useState } from 'react';
import { ShieldAlert, LogOut, Loader2, Lock } from 'lucide-react';

interface SessionExpiredStateProps {
  onRedirectToLogin: () => void;
}

export const SessionExpiredState: React.FC<SessionExpiredStateProps> = ({ onRedirectToLogin }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleAction = () => {
    setIsRedirecting(true);
    onRedirectToLogin();
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-full flex items-center justify-center p-4 md:p-8 bg-zinc-950/65 backdrop-blur-md animate-fade-in select-none">
      <div className="relative max-w-md w-full rounded-2xl overflow-hidden border border-outline-variant bg-surface-lowest/70 backdrop-blur-md shadow-2xl transition-all duration-300">
        
        {/* Glow Decorativo de Fondo */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Barra Superior Decorativa */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />

        <div className="p-8 flex flex-col items-center text-center relative z-10">
          
          {/* Ilustración de Seguridad Expirada */}
          <div className="relative mb-6 flex items-center justify-center">
            {/* Anillos de Pulsación */}
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute h-20 w-20 bg-amber-500/10 rounded-full animate-pulse" />
            
            {/* Contenedor del Icono Principal */}
            <div className="relative h-16 w-16 bg-gradient-to-b from-surface-lowest to-surface-container-high rounded-2xl border border-outline-variant shadow-lg flex items-center justify-center text-amber-500">
              <ShieldAlert className="h-8 w-8 animate-bounce [animation-duration:4s]" />
            </div>

            {/* Pequeño Indicador Candado */}
            <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white p-1 rounded-lg border-2 border-surface-lowest shadow-md">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Mensaje Institucional */}
          <h3 className="text-2xl font-black tracking-tight text-on-surface mb-2 font-sans">
            Su sesión ha vencido
          </h3>
          
          <p className="text-sm text-on-surface-variant/90 leading-relaxed max-w-sm mb-6">
            Su sesión de acceso ha expirado por inactividad o vencimiento del token. Por favor, <strong>vuelva a iniciar sesión</strong> para continuar operando en el sistema de Hospedaje RAYZA.
          </p>

          {/* Nota Informativa sobre la data */}
          <div className="w-full bg-amber-500/5 border border-amber-500/10 px-4 py-3 rounded-xl mb-6 text-left flex items-start gap-3">
            <span className="text-base select-none">🛡️</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Resguardo de datos:</strong> Todos los cambios confirmados previamente en el inventario, reservas o caja se encuentran almacenados de manera segura en el servidor central.
            </p>
          </div>

          {/* Botón de Acción Principal (Cierre de sesión y Redirección) */}
          <button 
            onClick={handleAction}
            disabled={isRedirecting}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-extrabold text-sm px-5 py-3 rounded-xl hover:translate-y-[-2px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/20 cursor-pointer"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Restableciendo terminal...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Volver a Iniciar Sesión</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};