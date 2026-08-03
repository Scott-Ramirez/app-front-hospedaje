import { useEffect } from 'react'; // 🌟 Importamos useEffect para manejar el ciclo de vida de forma limpia
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGlobalError } from '../../context/ErrorContext';

export const ProtectedRoute = () => {
  const { autenticado, cargando } = useAuth();
  const { clearGlobalError } = useGlobalError();

  // 🌟 SOLUCIÓN AL WARNING: Ejecuta la limpieza de estados externos de manera segura 
  // inmediatamente después de que el componente termine de procesar el renderizado.
  useEffect(() => {
    if (!cargando && !autenticado) {
      clearGlobalError();
    }
  }, [autenticado, cargando, clearGlobalError]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  // Si está autenticado, da paso a las pantallas internas. Si no, redirige directamente al Login.
  return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
};