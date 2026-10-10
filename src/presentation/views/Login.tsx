import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Loader2, Sun, Moon, Eye, EyeOff, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import logoRayzaLight from '../../assets/isotipo.png';
import logoRayzaDark from '../../assets/isotipo-dark.png';

export const Login = () => {
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const logoRayza = isDarkMode ? logoRayzaDark : logoRayzaLight;

  // Estados del formulario
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameUpper = username.trim().toUpperCase();

    if (!usernameUpper || !clave.trim()) {
      AlertAdapter.toast('Por favor, ingrese sus credenciales de acceso.', 'warning');
      return;
    }

    try {
      setCargando(true);
      await login(usernameUpper, clave);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      AlertAdapter.toast(err || 'Credenciales incorrectas.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const whatsappUrl = `https://wa.me/51920569220?text=${encodeURIComponent(
    'Hola, soy el Administrador del Hospedaje Rayza. Solicito soporte para restablecer mi contraseña de acceso al sistema.'
  )}`;

  return (
    <div 
      className={`relative min-h-screen w-full flex items-center justify-center p-4 transition-all duration-300 select-none overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#080d10] via-[#0d161a] to-[#060a0c] text-white' 
          : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e6edf2] text-slate-800'
      }`}
    >
      {/* ─── FONDOS AMBIENTALES Y AURAS LUMINOSAS ────────────────────────────── */}
      <div 
        className={`absolute h-[500px] w-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/15'
        }`} 
      />
      <div 
        className={`absolute h-[320px] w-[320px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? 'bg-amber-500/8' : 'bg-amber-500/10'
        }`} 
      />

      {/* Cuadrícula sutil decorativa */}
      <div 
        className={`inset-0 pointer-events-none opacity-[0.025] absolute ${
          isDarkMode ? 'invert' : ''
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle, #006b4d 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* ─── BOTÓN FLOTANTE MODO OSCURO / CLARO ────────────────────────────── */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2.5 rounded-full border border-outline-variant/60 bg-surface/80 hover:bg-surface-container backdrop-blur-md text-on-surface-variant transition-all shadow-xs cursor-pointer active:scale-95"
        title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        type="button"
      >
        {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* ─── TARJETA PRINCIPAL FROSTED GLASS ────────────────────────────────── */}
      <div 
        className={`relative z-10 w-full max-w-[410px] p-8 sm:p-9 rounded-3xl backdrop-blur-2xl border shadow-2xl flex flex-col items-center transition-all duration-300 animate-in fade-in zoom-in-95 duration-500 ${
          isDarkMode
            ? 'bg-zinc-900/75 border-white/10 shadow-black/60'
            : 'bg-white/85 border-slate-200/90 shadow-slate-300/50'
        }`}
      >
        
        {/* LOGO HERO / EMBLEMA */}
        <div className="relative mt-2 mb-2 flex items-center justify-center">
          {/* Resplandor ambiental suave centrado en el emblema */}
          <div className={`absolute h-32 w-32 rounded-full blur-2xl opacity-60 ${
            isDarkMode ? 'bg-emerald-500/25' : 'bg-emerald-600/15'
          }`} />

          <div className="relative h-36 w-36 md:h-40 md:w-40 flex items-center justify-center transform transition-transform duration-500 hover:scale-105">
            <img 
              src={logoRayza} 
              alt="Hospedaje RAYZA Logo" 
              className="h-full w-full object-contain filter drop-shadow-md" 
            />
          </div>
        </div>

        {/* SUBTÍTULO ELEGANTE */}
        <div className="mb-6 text-center">
          <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-on-surface-variant/80">
            Control de Recepción & Operaciones
          </span>
        </div>

        {/* FORMULARIO DE ACCESO */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          
          {/* CAMPO USUARIO */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Usuario del Sistema
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-on-surface-variant/50">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                disabled={cargando}
                placeholder="EJ: RECEPCION01"
                className="w-full rounded-xl border border-outline-variant/70 bg-surface-container-low/60 focus:bg-surface py-2.5 pl-10 pr-3.5 text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 uppercase"
              />
            </div>
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Contraseña de Terminal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-on-surface-variant/50">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={mostrarClave ? 'text' : 'password'}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={cargando}
                placeholder="••••••••"
                className="w-full rounded-xl border border-outline-variant/70 bg-surface-container-low/60 focus:bg-surface py-2.5 pl-10 pr-10 text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setMostrarClave(!mostrarClave)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer outline-none"
                title={mostrarClave ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* ENLACE RECUPERACIÓN ADMIN VÍA WHATSAPP Y NOTA PARA RECEPCIONISTAS */}
            <div className="pt-2 text-right space-y-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-primary hover:underline transition-colors inline-block cursor-pointer"
                title="Soporte exclusivo para la cuenta de Administrador"
              >
                ¿Olvidó la contraseña? <span className="font-semibold underline decoration-primary/40">(Solo Administrador)</span>
              </a>
              <p className="text-[10px] text-on-surface-variant/70 leading-snug">
                * Si es <b>recepcionista</b>, el Administrador puede restablecer su clave desde el sistema.
              </p>
            </div>
          </div>

          {/* BOTÓN SUBMIT */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary hover:opacity-90 active:scale-[0.99] py-3 px-4 text-xs font-bold text-on-primary shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validando Credenciales...</span>
              </>
            ) : (
              <>
                <span>Autenticar Identidad</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* PIE DE TARJETA CON SEGURIDAD Y VERSIÓN */}
        <div className="mt-6 pt-4 border-t border-outline-variant/40 w-full flex items-center justify-between text-[10px] font-semibold text-on-surface-variant">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Terminal Seguro</span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-mono font-bold text-primary border border-outline-variant/60">
            {import.meta.env.VITE_APP_VERSION || 'v1.3.0'}
          </span>
        </div>

      </div>

    </div>
  );
};