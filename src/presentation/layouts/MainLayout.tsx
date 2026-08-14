import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCajaSesion } from '../context/CajaSesionContext';
import { CierreCajaModal } from '../components/shared/CierreCajaModal';
import { SolicitudEgresoModal } from '../components/recepcion/SolicitudEgresoModal';
import { SolicitudesEgresoPanel } from '../components/shared/SolicitudesEgresoPanel';
import { useNotifications } from '../context/NotificationContext';

import sidebarLogoLight from '../../assets/sidebar-logo-light.png';
import sidebarLogoDark from '../../assets/sidebar-logo-dark.png';
import isotipoLight from '../../assets/isotipo.png';
import isotipoDark from '../../assets/isotipo-dark.png';

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
  ChevronLeft,
  ChevronDown,
  UserCog,
  Wallet,
  Receipt,
  BarChart3,
  Inbox
} from 'lucide-react';

export const MainLayout = () => {
  const { usuario, logout } = useAuth(); 
  const { isDarkMode, toggleTheme } = useTheme();
  const { cajaActiva } = useCajaSesion();
  const { conteoNoLeidas } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Selección de Logos adaptativos según el Tema (Modo Claro vs Modo Oscuro)
  const sidebarLogo = isDarkMode ? sidebarLogoDark : sidebarLogoLight;
  const isotipoLogo = isDarkMode ? isotipoDark : isotipoLight;

  // Estado para controlar el colapso del Sidebar con persistencia en localStorage
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const setIsCollapsed = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isSolicitudEgresoOpen, setIsSolicitudEgresoOpen] = useState(false);
  const [isPanelEgresoOpen, setIsPanelEgresoOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const activeRoute = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Estancias Activas', path: '/estancias', icon: <CalendarDays className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Habitaciones', path: '/habitaciones', icon: <BedDouble className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Huéspedes', path: '/huespedes', icon: <Users className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Historial', path: '/historial', icon: <History className="h-5 w-5 flex-shrink-0" /> },
    { label: 'Bandeja', path: '/bandeja', icon: <Inbox className="h-5 w-5 flex-shrink-0" /> },
    ...(usuario?.rol === 'admin' || usuario?.rol === 'supervisor' ? [{ label: 'Reportes', path: '/reportes', icon: <BarChart3 className="h-5 w-5 flex-shrink-0" /> }] : []),
    ...(usuario?.rol === 'admin' ? [{ label: 'Personal', path: '/usuarios', icon: <UserCog className="h-5 w-5 flex-shrink-0" /> }] : []),
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
        {/* Botón flotante al borde derecho del sidebar para colapsar/expandir sin afectar los logos */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-7 h-7 w-7 rounded-full bg-surface border border-outline-variant shadow-md flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:scale-110 transition-all cursor-pointer z-[60]"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Cabecera del Sidebar con Imagen Adaptativa */}
        <div className="px-4 mb-6 flex items-center justify-center min-h-[56px]">
          {!isCollapsed ? (
            <div className="flex items-center justify-center overflow-hidden animate-fade-in duration-200 py-1">
              <img 
                src={sidebarLogo} 
                alt="Hospedaje RAYZA" 
                className="h-14 md:h-16 max-w-[195px] object-contain filter drop-shadow-sm transition-all duration-300" 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center animate-fade-in duration-200 cursor-pointer p-0.5" title="Expandir menú" onClick={() => setIsCollapsed(false)}>
              <img 
                src={isotipoLogo} 
                alt="RAYZA" 
                className="h-14 w-14 md:h-16 md:w-16 object-contain filter drop-shadow-sm transition-all duration-300" 
              />
            </div>
          )}
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
                className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'text-primary font-bold border-r-4 border-primary bg-primary-container/10'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <div className="flex items-center gap-3 animate-fade-in duration-200">
                  {item.icon}
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </div>
                {item.path === '/bandeja' && conteoNoLeidas > 0 && (
                  isCollapsed ? (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-error rounded-full ring-1 ring-surface-container-lowest animate-pulse" />
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-error text-white rounded-full leading-none scale-90">
                      {conteoNoLeidas}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>        {/* Pie del Sidebar */}
        <div className="mt-auto px-3 pt-3 pb-1 text-center select-none border-t border-outline-variant/40">
          <span className={`inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/60 text-[9px] font-bold tracking-wider text-primary ${isCollapsed ? 'scale-90' : ''}`}>
            {import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </span>
          {!isCollapsed && (
            <p className="text-[10px] text-on-surface-variant/60 font-medium mt-1.5">
              Desarrollado por <span className="font-semibold text-on-surface-variant">Scott Ramirez</span>
            </p>
          )}
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

          <div className="h-6 w-[1px] bg-outline-variant mx-2" />

          {/* Perfil con Dropdown */}
          <div className="relative pl-2">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm border border-outline-variant uppercase shadow-sm">
                {usuario?.username?.substring(0, 2) || 'RX'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-none text-on-surface">
                  {usuario?.nombre || 'Terminal Activo'}
                </p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                  {usuario?.rol || 'Recepcionista'}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menú Desplegable Estilizado */}
            {isUserDropdownOpen && (
              <>
                {/* Backdrop invisible para cerrar al hacer clic afuera */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserDropdownOpen(false)} 
                />

                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-outline-variant shadow-2xl z-50 overflow-hidden animate-fade-in duration-150 p-1.5 space-y-0.5">
                  {(usuario?.rol === 'admin' || usuario?.rol === 'supervisor') && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        navigate('/configuraciones');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Settings className="h-4 w-4 text-primary" />
                      <span>Configuración</span>
                    </button>
                  )}

                  {/* Panel de Egresos (Para todos los roles, con nombre dinámico) */}
                  {usuario && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsPanelEgresoOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Receipt className="h-4 w-4 text-primary" />
                      <span>{usuario.rol === 'recepcionista' ? 'Mis Solicitudes de Egreso' : 'Egresos Pendientes'}</span>
                    </button>
                  )}

                  {/* Solicitar Egreso de Caja (Recepcionista con caja activa) */}
                  {usuario?.rol === 'recepcionista' && cajaActiva && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsSolicitudEgresoOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Receipt className="h-4 w-4 text-primary" />
                      <span>Solicitar Egreso (Paso 1)</span>
                    </button>
                  )}

                  {/* Cerrar Caja / Turno (Si hay sesión activa) */}
                  {cajaActiva && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsCierreModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Wallet className="h-4 w-4 text-amber-500" />
                      <span>Cerrar Caja / Turno</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-outline-variant/60" />

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}
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
          <Outlet context={{ isCollapsed, setIsCollapsed }} />
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