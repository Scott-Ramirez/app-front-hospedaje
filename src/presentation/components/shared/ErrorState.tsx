import React from 'react';
import { RefreshCw, WifiOff, MessageCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string | null;
  onRetry: () => Promise<void> | void;
  isRetrying: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  isRetrying
}) => {
  const handleContactSoporte = () => {
    const telefono = "51914976865"; 
    const texto = encodeURIComponent("Hola Soporte, el sistema me indica que no hay conexión con el servidor. Solicito asistencia.");
    window.open(`https://wa.me/${telefono}?text=${texto}`, '_blank');
  };

  // Determinar el mensaje amigable y específico para el usuario final
  let friendlyTitle = "Conexión Interrumpida";
  let friendlyDescription = "No se pudo establecer comunicación con el sistema central. Por favor, verifica tu conexión de red o contacta con el administrador.";
  let tipText = "Verifica que el cable de red de tu computadora esté conectado o que tu señal de Wi-Fi esté activa.";

  const errStr = (message || '').toLowerCase();
  
  if (errStr.includes('network') || errStr.includes('connection') || errStr.includes('refused') || errStr.includes('offline')) {
    friendlyTitle = "Sin conexión al servidor central";
    friendlyDescription = "La aplicación no puede conectarse con la red central. Esto suele deberse a que el cable de internet de la recepción está desconectado, o a que la computadora principal del hospedaje se encuentra apagada.";
    tipText = "Asegúrate de que la computadora principal (el servidor del hotel) esté encendida y que el módem de internet funcione correctamente.";
  } else if (errStr.includes('500') || errStr.includes('internal server error') || errStr.includes('database') || errStr.includes('query')) {
    friendlyTitle = "Inconveniente temporal en el Servidor";
    friendlyDescription = "El servidor central recibió la solicitud pero experimentó un problema momentáneo al procesar la información en la base de datos.";
    tipText = "Espera unos segundos y presiona el botón 'Reintentar Conexión'. Si el problema persiste, informa de inmediato al supervisor.";
  }

  return (
    <div className="fixed inset-0 z-[9999] w-full h-full flex items-center justify-center p-4 md:p-8 bg-zinc-950/65 backdrop-blur-md animate-fade-in select-none">
      <div className="relative max-w-md w-full rounded-2xl overflow-hidden border border-outline-variant bg-surface-lowest/70 backdrop-blur-md shadow-2xl transition-all duration-300">
        
        {/* Glow Decorativo de Fondo */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-error/10 to-transparent blur-3xl pointer-events-none" />

        {/* Barra Superior Decorativa */}
        <div className="h-1.5 w-full bg-gradient-to-r from-error via-red-500 to-amber-500" />

        <div className="p-8 flex flex-col items-center text-center relative z-10">
          
          {/* Ilustración de Conexión Pulsante */}
          <div className="relative mb-6 flex items-center justify-center">
            {/* Anillos de Pulsación */}
            <div className="absolute inset-0 bg-error/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute h-20 w-20 bg-error/10 rounded-full animate-pulse" />
            
            {/* Contenedor del Icono Principal */}
            <div className="relative h-16 w-16 bg-gradient-to-b from-surface-lowest to-surface-container-high rounded-2xl border border-outline-variant shadow-lg flex items-center justify-center text-error">
              <WifiOff className="h-8 w-8 animate-bounce [animation-duration:4s]" />
            </div>

            {/* Pequeño Indicador Alert */}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-on-primary p-1 rounded-lg border-2 border-surface-lowest shadow-md">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Textos */}
          <h3 className="text-xl font-black tracking-tight text-on-surface mb-3 font-sans leading-snug">
            {friendlyTitle}
          </h3>
          
          <p className="text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-sm mb-6">
            {friendlyDescription}
          </p>

          {/* Aviso Aclaratorio y Guía Práctica */}
          <div className="w-full bg-surface-container/60 border border-outline-variant/60 p-4 rounded-xl mb-6 text-left flex items-start gap-3">
            <div className="p-1 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1">
                ¿Qué puedes hacer?
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {tipText}
              </p>
            </div>
          </div>

          {/* Botones de Acción Modificados */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Botón Reintentar */}
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-extrabold text-xs px-4 py-3 rounded-xl hover:translate-y-[-2px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/20 cursor-pointer"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span>Reintentar Conexión</span>
                </>
              )}
            </button>

            {/* Botón de Soporte */}
            <button
              onClick={handleContactSoporte}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl hover:bg-emerald-700 hover:translate-y-[-2px] active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 shrink-0 fill-white/20" />
              <span>Soporte Técnico</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};