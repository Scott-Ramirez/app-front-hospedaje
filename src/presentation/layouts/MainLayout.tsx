import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCajaSesion } from '../context/CajaSesionContext';
import { NotificationBell } from '../components/shared/NotificationBell';
import { CierreCajaModal } from '../components/shared/CierreCajaModal';
import { SolicitudEgresoModal } from '../components/recepcion/SolicitudEgresoModal';
import { SolicitudesEgresoPanel } from '../components/shared/SolicitudesEgresoPanel';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BedDouble, 
  Users, 
  History, 
  Settings, 
  Sun, 
  Moon, 
  LogOut,
  Menu,
  ChevronLeft,
  UserCog,
  Wallet,
  Receipt,
  BarChart3
} from 'lucide-react';

export const MainLayout = () => {
  const { usuario, logout } = useAuth(); 
  const { isDarkMode, toggleTheme } = useTheme();
  const { cajaActiva } = useCajaSesion();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para controlar el colapso del Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isSolicitudEgresoOpen, setIsSolicitudEgresoOpen] = useState(false);
  const [isPanelEgresoOpen, setIsPanelEgresoOpen] = useState(false);

  const activeRoute = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Estancias Activas', path: '/estancias', icon: <CalendarDays className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Habitaciones', path: '/habitaciones', icon: <BedDouble className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Huéspedes', path: '/huespedes', icon: <Users className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Historial', path: '/historial', icon: <History className="h-5 w-5 flex-shrink-0" /> },
    ...(usuario?.rol === 'admin' || usuario?.rol === 'supervisor' ? [{ label: 'Reportes', path: '/reportes', icon: <BarChart3 className="h-5 w-5 flex-shrink-0 text-primary" /> }] : []),
    ...(usuario?.rol === 'admin' ? [{ label: 'Personal', path: '/usuarios', icon: <UserCog className="h-5 w-5 flex-shrink-0 text-amber-500" /> }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface transition-colors duration-200 flex">
      
      {/* 1. SIDEBAR IZQUIERDO */}
      <aside 
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-outline-variant bg-surface-container-lowest py-6 shadow-sm will-change-[width] transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className={`px-6 mb-8 flex items-center justify-between ${isCollapsed ? 'justify-center px-2' : ''}`}>
          {!isCollapsed && (
            <div className="animate-fade-in duration-200">
              <h1 className="text-xl font-bold tracking-tight text-primary whitespace-nowrap">
                Hospedaje RAYZA
              </h1>
              <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mt-0.5 whitespace-nowrap">
                Panel de Operaciones
              </p>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = activeRoute === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'text-primary font-bold border-r-4 border-primary bg-primary-container/10'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {item.icon}
                {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Pie del Sidebar */}
        <div className="mt-auto px-3 pt-4 border-t border-outline-variant space-y-1">
          <Link
            to="/configuraciones"
            title={isCollapsed ? "Configuración" : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeRoute === '/configuraciones'
                ? 'text-primary font-bold border-r-4 border-primary bg-primary-container/10'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap">Configuración</span>}
          </Link>

          {/* Botón Solicitar Egreso (solo recepcionistas con caja activa) */}
          {usuario?.rol === 'recepcionista' && cajaActiva && (
            <button
              onClick={() => setIsSolicitudEgresoOpen(true)}
              title={isCollapsed ? 'Solicitar Egreso de Caja' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 text-left cursor-pointer ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Receipt className="h-5 w-5 flex-shrink-0 text-primary" />
              {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap font-bold">Solicitar Egreso</span>}
            </button>
          )}

          {/* Panel de solicitudes de egreso (admin y supervisor) */}
          {(usuario?.rol === 'admin' || usuario?.rol === 'supervisor') && (
            <button
              onClick={() => setIsPanelEgresoOpen(true)}
              title={isCollapsed ? 'Solicitudes de Egreso' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 text-left cursor-pointer ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Receipt className="h-5 w-5 flex-shrink-0 text-primary" />
              {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap font-bold">Egresos Pendientes</span>}
            </button>
          )}

          {/* Botón de Cierre de Caja (Condicionado por sesión activa) */}
          {cajaActiva && (
            <button
              onClick={() => setIsCierreModalOpen(true)}
              title={isCollapsed ? "Cerrar Caja / Turno" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-all duration-200 text-left cursor-pointer ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Wallet className="h-5 w-5 flex-shrink-0 text-amber-500" />
              {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap text-amber-600 dark:text-amber-500 font-bold">Cerrar Caja / Turno</span>}
            </button>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-error hover:bg-error-container/20 transition-all duration-200 text-left cursor-pointer ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="animate-fade-in duration-200 whitespace-nowrap font-bold">Cerrar Sesión</span>}
          </button>

          {/* Footer de Versión e Información dentro del Sidebar */}
          <div className="pt-3 pb-1 text-center select-none border-t border-outline-variant/30 mt-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/60 text-[9px] font-bold tracking-wider text-primary ${isCollapsed ? 'scale-90' : ''}`}>
              {import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </span>
            {!isCollapsed && (
              <p className="text-[9px] text-on-surface-variant/50 font-medium mt-1">
                Hospedaje RAYZA © {new Date().getFullYear()}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* 2. NAVBAR TOPBAR */}
      <header 
        className={`fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant px-6 will-change-[width,left] transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-16rem)]'
        } ${isDarkMode ? 'bg-zinc-900' : 'bg-surface'}`}
      >
        <div className="flex-1" />

        {/* Controles del Topbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full cursor-pointer transition-colors active:scale-95"
            title="Cambiar tema"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationBell />

          <div className="h-6 w-[1px] bg-outline-variant mx-2" />

          {/* Perfil */}
          <div className="flex items-center gap-3 pl-2">
            <div className="h-8 w-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm border border-outline-variant uppercase">
              {usuario?.username?.substring(0, 2) || 'RX'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-none text-on-surface">
                {usuario?.nombre || 'Terminal Activo'}
              </p>
              <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mt-0.5">
                {usuario?.rol || 'Recepcionista'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. CANVAS CONTENEDOR PRINCIPAL */}
      <main 
        className={`pt-20 pb-12 p-6 min-h-screen flex-grow bg-background will-change-[margin-left] transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>

      {/* Modal de Cierre de Caja */}
      <CierreCajaModal 
        isOpen={isCierreModalOpen} 
        onClose={() => setIsCierreModalOpen(false)} 
      />

      {/* Modal Solicitud de Egreso (Recepcionista) */}
      {isSolicitudEgresoOpen && (
        <SolicitudEgresoModal onClose={() => setIsSolicitudEgresoOpen(false)} />
      )}

      {/* Panel de Solicitudes de Egreso (Admin/Supervisor) — slide-in drawer */}
      {isPanelEgresoOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsPanelEgresoOpen(false)} />
          <div className="w-full max-w-lg bg-surface h-full overflow-hidden shadow-2xl flex flex-col">
            <SolicitudesEgresoPanel onClose={() => setIsPanelEgresoOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
};