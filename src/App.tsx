import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importación de pantallas y guards de visualización
import { Splash } from './presentation/views/Splash';
import { ScreenGuard } from './presentation/components/guards/ScreenGuard'; 
import { MainLayout } from './presentation/layouts/MainLayout';
import { CajaGuard } from './presentation/components/guards/CajaGuard';

// Importaciones de Vistas
import { Login } from './presentation/views/Login';
import { Dashboard } from './presentation/views/Dashboard';
import { ConfiguracionesPanel } from './presentation/views/ConfiguracionesPanel';
import HabitacionesCRUD from './presentation/views/HabitacionesCRUD';
import { HistorialSalidas } from './presentation/views/HistorialSalidas';
import { HuespedesCRUD } from './presentation/views/HuespedesCRUD'; 
import { EstanciasActivas } from './presentation/views/EstanciasActivas'; // 🌟 ACTUALIZADO: Importación de la nueva vista
import { UsuariosPanel } from './presentation/views/UsuariosPanel';
import { AuditoriaCaja } from './presentation/views/AuditoriaCaja';
import { ReportesPanel } from './presentation/views/ReportesPanel';
import { BandejaNotificaciones } from './presentation/views/BandejaNotificaciones';

// Importaciones de Filtros de Seguridad / Guards de Sesión
import { ProtectedRoute } from './presentation/components/guards/ProtectedRoute';
import { RoleGuard } from './presentation/components/guards/RoleGuard';

// Importación del Proveedor de Notificaciones en Tiempo Real
import { NotificationProvider } from './presentation/context/NotificationContext';

// Importaciones del interceptor y el hook de errores
import { useGlobalError } from './presentation/context/ErrorContext';
import { injectErrorNotifier } from './data/adapters/api.adapter';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { setGlobalError } = useGlobalError();
  
  useEffect(() => {
    injectErrorNotifier(setGlobalError);
  }, [setGlobalError]);

  if (showSplash) {
    return <Splash onFinished={() => setShowSplash(false)} />;
  }

  return (
    <NotificationProvider>
      <BrowserRouter> 
        <ScreenGuard>
          <Routes>
            {/* Ruta Pública Independiente */}
            <Route path="/login" element={<Login />} />

            {/* 🔒 CAPA 1: Rutas Protegidas */}
            <Route element={<ProtectedRoute />}>
              
              {/* Contenedor estructural compartido */}
              <Route element={<CajaGuard><MainLayout /></CajaGuard>}>
                
                {/* Dashboard general */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* 🔒 CAPA 1.5: Rutas exclusivas para Admin */}
                <Route element={<RoleGuard rolesPermitidos={['admin']} />}>
                  <Route path="/usuarios" element={<UsuariosPanel />} />
                </Route>

                {/* 🔒 CAPA 2: Rutas Restringidas exclusivas para Admin y Supervisor */}
                <Route element={<RoleGuard rolesPermitidos={['admin', 'supervisor']} />}>
                  <Route path="/configuraciones" element={<ConfiguracionesPanel />} />
                  <Route path="/auditoria-caja" element={<AuditoriaCaja />} />
                  <Route path="/reportes" element={<ReportesPanel />} />
                </Route>

                {/* 🌟 CAPA 3: Rutas con acceso extendido al Recepcionista */}
                <Route element={<RoleGuard rolesPermitidos={['admin', 'supervisor', 'recepcionista']} />}>
                  <Route path="/estancias" element={<EstanciasActivas />} /> {/* 🌟 ACTUALIZADO: Ruta de estancias inyectada con éxito */}
                  <Route path="/habitaciones" element={<HabitacionesCRUD />} />
                  <Route path="/huespedes" element={<HuespedesCRUD />} /> 
                  <Route path="/historial" element={<HistorialSalidas />} />
                  <Route path="/bandeja" element={<BandejaNotificaciones />} />
                </Route>
                
              </Route>

            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ScreenGuard>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;