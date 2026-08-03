import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { KeyRound, User, Hotel, Loader2, Sun, Moon } from 'lucide-react';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

export const Login = () => {
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Estados del formulario
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !clave.trim()) {
      AlertAdapter.toast('Por favor, ingrese sus credenciales de acceso.', 'warning');
      return;
    }

    try {
      setCargando(true);
      // Ejecuta la llamada al repositorio que ya mapea "password" a tu backend
      await login(username, clave);
      
      // ¡REDIRECCIÓN ACTIVA! Redirige al Dashboard y limpia el historial de login
      navigate('/dashboard', { replace: true });
      
    } catch (err: any) {
      // 🌟 Mostrar SweetAlert Toast en la esquina de la pantalla en lugar de banner invasivo
      AlertAdapter.toast(err || 'Credenciales incorrectas.', 'error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 transition-colors duration-300">
      
      {/* Botón Flotante de Modo Oscuro / Claro */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container transition-all shadow-sm outline-none cursor-pointer"
        title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      >
        {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Tarjeta del Formulario (Nivel 1 de Elevación Tonal) */}
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-8 shadow-sm border border-outline-variant transition-colors duration-300">
        
        {/* Encabezado Institucional (Corporate Modern) */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm transition-colors">
            <Hotel className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-on-surface tracking-tight font-sans">
            Hospedaje RAYZA
          </h2>
          <span className="mt-1 text-xs font-medium tracking-widest text-on-surface-variant/70 uppercase">
            Control de Recepción y Operaciones
          </span>
        </div>

        {/* Formulario de Alta Densidad */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Usuario del Sistema
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={cargando}
                placeholder="ej: nick"
                className="w-full rounded-md border border-outline bg-surface-low py-2 pl-9 pr-3 text-sm text-on-surface placeholder-outline-variant outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Contraseña de Terminal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={cargando}
                placeholder="••••••••"
                className="w-full rounded-md border border-outline bg-surface-low py-2 pl-9 pr-3 text-sm text-on-surface placeholder-outline-variant outline-none transition-all focus:border-primary focus:bg-surface-lowest focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-2 flex items-center justify-center rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-on-primary shadow-md hover:bg-primary-container transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando en Servidor...
              </>
            ) : (
              'Autenticar Identidad'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};