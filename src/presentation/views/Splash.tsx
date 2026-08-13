import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoRayzaLight from '../../assets/isotipo.png';
import logoRayzaDark from '../../assets/isotipo-dark.png';

interface SplashProps {
  onFinished: () => void;
}

export const Splash = ({ onFinished }: SplashProps) => {
  const { cargando } = useAuth();
  const { isDarkMode } = useTheme();
  const [progress, setProgress] = useState(0);

  const logoRayza = isDarkMode ? logoRayzaDark : logoRayzaLight;

  // Animación suave de progreso de 0% a 100% (Duración extendida a ~4.5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30); // Completa el 100% en 4 segundos (40ms * 100) + pausa de cierre

    return () => clearInterval(interval);
  }, []);

  // Transición cuando la carga del AuthContext finaliza y la barra llega al 100%
  useEffect(() => {
    if (!cargando && progress >= 100) {
      const timer = setTimeout(() => {
        onFinished();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cargando, progress, onFinished]);

  return (
    <div 
      className={`relative min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden select-none ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#090d10] via-[#10171a] to-[#07090b] text-white' 
          : 'bg-gradient-to-b from-[#ffffff] via-[#f7faf8] to-[#edf4f0] text-slate-900'
      }`}
    >
      
      {/* Resplandor ambiental adaptativo */}
      <div 
        className={`absolute h-[500px] w-[500px] rounded-full blur-[120px] pointer-events-none animate-pulse ${
          isDarkMode ? 'bg-emerald-500/5' : 'bg-emerald-500/8'
        }`} 
      />
      <div 
        className={`absolute h-[300px] w-[300px] rounded-full blur-[90px] pointer-events-none ${
          isDarkMode ? 'bg-amber-500/5' : 'bg-amber-500/8'
        }`} 
      />

      {/* Contenedor Principal */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in">
        
        {/* Isotipo PNG Transparente del Hospedaje RAYZA (Adaptativo Claro / Oscuro) */}
        <div className="relative group mb-6">
          <div className={`absolute -inset-2 rounded-full blur-xl transition duration-500 opacity-40 group-hover:opacity-75 ${
            isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-600/20'
          }`} />
          
          <div className="relative h-48 w-48 md:h-56 md:w-56 p-2 flex items-center justify-center transform transition-transform duration-700 hover:scale-105">
            <img 
              src={logoRayza} 
              alt="Isotipo Hospedaje RAYZA" 
              className="h-full w-full object-contain filter drop-shadow-md transition-opacity duration-300"
            />
          </div>
        </div>

        {/* Textos Informativos */}
        <div className="space-y-1 mt-1">
          <p className={`text-[11px] md:text-xs font-bold tracking-[0.3em] uppercase ${
            isDarkMode ? 'text-amber-400/90' : 'text-[#006b4d]'
          }`}>
            Sistema de Gestión & Recepción Hotelera
          </p>
        </div>

        {/* Indicador de Carga del Sistema con Porcentaje de 0% a 100% */}
        <div className="mt-8 space-y-2 w-52 md:w-64">
          <div className={`h-2 rounded-full p-0.5 border overflow-hidden shadow-inner ${
            isDarkMode 
              ? 'bg-emerald-950/80 border-emerald-500/30' 
              : 'bg-emerald-100/80 border-emerald-400/40'
          }`}>
            <div 
              className={`h-full rounded-full transition-all duration-75 ease-out ${
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 shadow-xs shadow-emerald-400/50'
                  : 'bg-gradient-to-r from-[#006b4d] via-amber-500 to-[#006b4d] shadow-xs shadow-emerald-600/30'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider">
            <span className={isDarkMode ? 'text-emerald-200/60' : 'text-slate-500'}>
              Cargando sistema...
            </span>
            <span className={isDarkMode ? 'text-amber-400' : 'text-[#006b4d]'}>
              {progress}%
            </span>
          </div>
        </div>

      </div>

      {/* Pie de página institucional */}
      <div className={`absolute bottom-6 text-[10px] font-bold tracking-[0.25em] uppercase ${
        isDarkMode ? 'text-emerald-300/40' : 'text-slate-400'
      }`}>
        {import.meta.env.VITE_APP_VERSION || '1.0.0'} • Desarrollado por Scott Ramirez
      </div>
    </div>
  );
};