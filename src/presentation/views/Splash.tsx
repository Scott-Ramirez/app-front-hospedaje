import { useEffect, useState, useMemo } from 'react';
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
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [etapaIndex, setEtapaIndex] = useState(0);

  const logoRayza = isDarkMode ? logoRayzaDark : logoRayzaLight;

  // Ciclo de mensajes dinámicos de inicialización
  const etapas = useMemo(() => [
    { titulo: 'Iniciando terminal del sistema...', sub: 'Conectando con el servidor local' },
    { titulo: 'Sincronizando inventario...', sub: 'Cargando habitaciones y tarifas activas' },
    { titulo: 'Verificando turnos y caja...', sub: 'Validando estado operativo de recepción' },
    { titulo: 'Todo listo...', sub: 'Cargando panel de control' },
  ], []);

  // Intervalo para cambiar las etapas cada 700ms
  useEffect(() => {
    const timer = setInterval(() => {
      setEtapaIndex((prev) => (prev < etapas.length - 1 ? prev + 1 : prev));
    }, 650);

    return () => clearInterval(timer);
  }, [etapas.length]);

  // Tiempo mínimo de visualización elegante (2.6 segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  // Transición suave de salida
  useEffect(() => {
    if (minTimeElapsed && !cargando) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        onFinished();
      }, 500);

      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, cargando, onFinished]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] min-h-screen w-full flex flex-col items-center justify-center p-4 transition-all duration-500 select-none ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#080d10] via-[#0d161a] to-[#060a0c] text-white' 
          : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e6edf2] text-slate-800'
      }`}
    >
      {/* ─── FONDOS AMBIENTALES DE ALTO NIVEL ─────────────────────────────────── */}
      <div 
        className={`absolute h-[480px] w-[480px] rounded-full blur-[130px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/12'
        }`} 
      />
      <div 
        className={`absolute h-[320px] w-[320px] rounded-full blur-[110px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? 'bg-amber-500/8' : 'bg-amber-500/10'
        }`} 
      />

      {/* ─── TARJETA FROSTED GLASS PRINCIPAL ────────────────────────────────── */}
      <div 
        className={`relative z-10 w-full max-w-[380px] p-8 md:p-9 rounded-3xl backdrop-blur-2xl border shadow-2xl flex flex-col items-center text-center transition-all duration-300 animate-in fade-in zoom-in-95 duration-500 ${
          isDarkMode
            ? 'bg-zinc-900/75 border-white/10 shadow-black/60'
            : 'bg-white/85 border-slate-200/90 shadow-slate-300/50'
        }`}
      >
        {/* BADGE DE SISTEMA SUPERIOR */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border shadow-2xs ${
            isDarkMode 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
              : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Hotelero</span>
          </span>
        </div>

        {/* LOGO HERO / EMBLEMA */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Resplandor ambiental suave centrado en el emblema */}
          <div className={`absolute h-36 w-36 rounded-full blur-2xl opacity-70 ${
            isDarkMode ? 'bg-emerald-500/25' : 'bg-emerald-600/15'
          }`} />

          {/* Imagen del emblema con micro-animación suave */}
          <div className="relative h-36 w-36 md:h-40 md:w-40 flex items-center justify-center transform transition-transform duration-700 hover:scale-105">
            <img 
              src={logoRayza} 
              alt="Hospedaje RAYZA" 
              className="h-full w-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* ─── NUEVA ANIMACIÓN DE CARGA ELEGANTE ────────────────────────────── */}
        <div className="mt-5 flex flex-col items-center gap-3 w-full">
          
          {/* SPINNER CIRCULAR DUAL-RING CON GRADIENTE Y PULSO */}
          <div className="relative h-11 w-11 flex items-center justify-center">
            {/* Anillo de fondo sutil */}
            <div className={`absolute inset-0 rounded-full border-[2.5px] ${
              isDarkMode ? 'border-zinc-800' : 'border-slate-200'
            }`} />

            {/* Anillo de rotación suave con degradé esmeralda/ámbar */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-emerald-600 dark:border-t-emerald-400 border-r-amber-500 animate-spin" />

            {/* Núcleo central pulsante */}
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>

          {/* TEXTO DE ESTADO DINÁMICO */}
          <div className="space-y-0.5 min-h-[38px] flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-on-surface tracking-wide transition-all duration-300">
              {etapas[etapaIndex].titulo}
            </p>
            <p className="text-[10.5px] text-on-surface-variant font-medium transition-all duration-300">
              {etapas[etapaIndex].sub}
            </p>
          </div>

          {/* ONDA DE PUNTOS RÍTMICOS (INDICADOR DE PROCESO VIVO) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce" />
          </div>

        </div>

        {/* ─── PIE DE TARJETA CON VERSIÓN CENTRADA ─────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-outline-variant/40 w-full flex items-center justify-center text-[10px] font-semibold text-on-surface-variant">
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-mono font-bold text-primary border border-outline-variant/60 shadow-2xs">
            {import.meta.env.VITE_APP_VERSION || 'v1.6.0'}
          </span>
        </div>

      </div>

    </div>
  );
};