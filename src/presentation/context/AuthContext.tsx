// 1. Importaciones de valores de React normales, y solo tipo para ReactNode
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// 2. Importación del tipo puro de tu entidad
import type { Usuario } from '../../core/entities/usuario.entity';

// 3. Importación de la clase del repositorio (es un valor real)
import { AuthRepository } from '../../data/repositories/auth.repository';

// Instanciamos nuestro repositorio (capa de datos)
const authRepository = new AuthRepository();

// Definimos qué información compartirá este Contexto con toda la App
interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  cargando: boolean;
  debeChangiarPassword: boolean;
  setDebeChangiarPassword: (val: boolean) => void;
  login: (username: string, clave: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del Contexto
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [debeChangiarPassword, setDebeChangiarPassword] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);

  // Al arrancar la app, verifica si el recepcionista o admin ya se había logueado antes
  useEffect(() => {
    const token = sessionStorage.getItem('hospedaje_token') || localStorage.getItem('hospedaje_token');
    const usuarioGuardado = sessionStorage.getItem('hospedaje_usuario') || localStorage.getItem('hospedaje_usuario');
    const forceChange = sessionStorage.getItem('hospedaje_change_password') === 'true' || localStorage.getItem('hospedaje_change_password') === 'true';

    // 🌟 Validación defensiva: Si el token existe pero es un string "undefined", limpiamos de inmediato
    if (token === 'undefined' || token === 'null') {
      sessionStorage.removeItem('hospedaje_token');
      sessionStorage.removeItem('hospedaje_usuario');
      sessionStorage.removeItem('hospedaje_change_password');
      localStorage.removeItem('hospedaje_token');
      localStorage.removeItem('hospedaje_usuario');
      localStorage.removeItem('hospedaje_change_password');
      setUsuario(null);
      setDebeChangiarPassword(false);
    } else if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
        setDebeChangiarPassword(forceChange);
      } catch (e) {
        // Si el JSON está corrupto, limpiamos todo
        sessionStorage.removeItem('hospedaje_token');
        sessionStorage.removeItem('hospedaje_usuario');
        sessionStorage.removeItem('hospedaje_change_password');
        localStorage.removeItem('hospedaje_token');
        localStorage.removeItem('hospedaje_usuario');
        localStorage.removeItem('hospedaje_change_password');
      }
    }
    setCargando(false);
  }, []);

  // Función lógica para iniciar sesión conectada al API NestJS
  const login = async (username: string, clave: string) => {
    try {
      setCargando(true);
      const sesion = await authRepository.login(username, clave);
      
      // Mapeo directo y exacto de la sesión
      const tokenReal = sesion.access_token;
      const usuarioReal = sesion.usuario;
      const forceChange = sesion.debeChangiarPassword;

      if (!tokenReal) {
        throw new Error('TOKEN_NOT_FOUND');
      }

      // Guardamos credenciales reales en sessionStorage
      sessionStorage.setItem('hospedaje_token', tokenReal);
      sessionStorage.setItem('hospedaje_usuario', JSON.stringify(usuarioReal));
      sessionStorage.setItem('hospedaje_change_password', String(forceChange));
      
      setUsuario(usuarioReal);
      setDebeChangiarPassword(forceChange);
    } catch (error: any) {
      if (error instanceof Error && error.message === 'TOKEN_NOT_FOUND') {
        throw 'El backend autenticó tus datos, pero no devolvió la propiedad access_token esperada.';
      }

      // Reenviamos el error de Axios (ej: 401 Credenciales incorrectas)
      throw error?.response?.data?.message || 'Error al conectar con el servidor del hospedaje.';
    } finally {
      setCargando(false);
    }
  };

  // Función para cerrar sesión y limpiar el mostrador
  const logout = () => {
    sessionStorage.removeItem('hospedaje_token');
    sessionStorage.removeItem('hospedaje_usuario');
    sessionStorage.removeItem('hospedaje_change_password');
    localStorage.removeItem('hospedaje_token');
    localStorage.removeItem('hospedaje_usuario');
    localStorage.removeItem('hospedaje_change_password');
    setUsuario(null);
    setDebeChangiarPassword(false);
  };

  return (
    <AuthContext.Provider value={{ usuario, autenticado: !!usuario, cargando, debeChangiarPassword, setDebeChangiarPassword, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook para consumir la autenticación de forma ultra limpia en las vistas
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado estrictamente dentro de un AuthProvider');
  }
  return context;
};