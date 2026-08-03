import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthRepository } from '../../../data/repositories/auth.repository';
import { AlertAdapter } from '../../../core/adapters/alert.adapter';
import { KeyRound, ShieldAlert, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const authRepository = new AuthRepository();

export const CambiarPasswordModal: React.FC = () => {
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!passwordActual.trim() || !nuevaPassword.trim() || !confirmarPassword.trim()) {
      setErrorLocal('Todos los campos son obligatorios.');
      return;
    }

    if (nuevaPassword.length < 8) {
      setErrorLocal('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorLocal('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (nuevaPassword === passwordActual) {
      setErrorLocal('La nueva contraseña no puede ser igual a la actual.');
      return;
    }

    try {
      setLoading(true);
      const res = await authRepository.cambiarPassword(passwordActual, nuevaPassword);
      
      AlertAdapter.success(
        'Contraseña Actualizada',
        res.mensaje || 'Inicia sesión nuevamente con tus nuevas credenciales.'
      );
      
      // Descarta el token actual y redirige al login
      logout();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err || 'Error al actualizar la contraseña.';
      setErrorLocal(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md px-4 select-none">
      
      {/* Botón Flotante de Modo Oscuro / Claro */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container transition-all shadow-sm outline-none cursor-pointer"
        title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      >
        {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md rounded-2xl bg-surface-lowest p-8 shadow-2xl border border-outline-variant text-on-surface animate-fade-in duration-300">
        
        {/* Cabecera de Alerta */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/20 mb-4 animate-pulse">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Cambio de Contraseña Obligatorio</h3>
          <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            Por políticas de seguridad del hotel, debes actualizar tu contraseña temporal antes de continuar operando el mostrador.
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorLocal && (
          <div className="mb-4 rounded-lg bg-error-container p-3 text-xs text-on-error-container border border-error/20 flex items-start gap-2 animate-fade-in">
            <span className="font-semibold shrink-0">Error:</span>
            <p className="opacity-90">{errorLocal}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Contraseña Actual */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Contraseña Actual (Temporal)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type={showActual ? 'text' : 'password'}
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                disabled={loading}
                placeholder="Ingresa clave actual"
                className="w-full rounded-lg border border-outline bg-surface-low py-2 pl-9 pr-10 text-sm text-on-surface placeholder-outline-variant outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Nueva Contraseña (Mínimo 8 caracteres)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type={showNueva ? 'text' : 'password'}
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                disabled={loading}
                placeholder="Ingresa nueva clave"
                className="w-full rounded-lg border border-outline bg-surface-low py-2 pl-9 pr-10 text-sm text-on-surface placeholder-outline-variant outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNueva(!showNueva)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type={showConfirmar ? 'text' : 'password'}
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirma nueva clave"
                className="w-full rounded-lg border border-outline bg-surface-low py-2 pl-9 pr-10 text-sm text-on-surface placeholder-outline-variant outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-on-primary shadow-md hover:bg-primary-container transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando Contraseña...
              </>
            ) : (
              'Actualizar Contraseña'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
