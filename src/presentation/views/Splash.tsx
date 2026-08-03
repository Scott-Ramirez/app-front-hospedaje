import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hotel } from 'lucide-react';

interface SplashProps {
  onFinished: () => void;
}

export const Splash = ({ onFinished }: SplashProps) => {
  const { cargando } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Forzamos un mínimo de 2.5 segundos para que la animación fluya estéticamente 
    // y no dé un salto brusco en pantallas ultra rápidas.
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cuando el AuthContext termine de leer el LocalStorage/API AND el tiempo mínimo termine, pasamos el control
    if (!cargando && minTimeElapsed) {
      onFinished();
    }
  }, [cargando, minTimeElapsed, onFinished]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-on-primary transition-colors duration-300 dark:bg-surface-dim dark:text-primary">
      <div className="flex flex-col items-center animate-fade-in">
        
        {/* Contenedor del Logo con Elevación Tonal Soft */}
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-lg shadow-primary-container/20 dark:bg-primary dark:text-on-primary transform transition-transform duration-500 hover:scale-105">
          <Hotel className="h-11 w-11" />
        </div>

        {/* Tipografía Corporativa con Tracking Ajustado */}
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-center font-sans">
          Hospedaje RAYZA
        </h1>
        <p className="mt-1.5 text-sm font-medium tracking-wide text-on-primary-container/80 dark:text-on-surface-variant uppercase text-xs">
          Property Management System
        </p>

        {/* Indicador de progreso minimalista */}
        <div className="mt-10 w-32 h-1 bg-primary-container/30 rounded-full overflow-hidden dark:bg-surface-container">
          <div className="h-full bg-on-primary rounded-full animate-progress dark:bg-primary" />
        </div>

      </div>

      {/* Pie de página institucional */}
      <div className="absolute bottom-6 text-[11px] font-medium tracking-widest text-on-primary/60 dark:text-on-surface-variant/60 uppercase">
        {import.meta.env.VITE_APP_VERSION || '1.0.0'} • Sistema de Control Interno
      </div>
    </div>
  );
};