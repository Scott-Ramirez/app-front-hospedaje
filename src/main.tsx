// 1. Importaciones de React y Renderizador Core
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 2. Importaciones de la Capa de Presentación (Contextos y App)
import App from './App.tsx'
import { AuthProvider } from './presentation/context/AuthContext.tsx'
import { ThemeProvider } from './presentation/context/ThemeContext.tsx' // <-- Importamos el control de tema
import { ErrorProvider } from './presentation/context/ErrorContext.tsx' // 🌟 AGREGADO: Proveedor de control de errores globales
import { CajaSesionProvider } from './presentation/context/CajaSesionContext.tsx'

// 3. Estilos Globales (Tailwind)
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider> {/* Envoltura del Sistema de Diseño y Modo Oscuro */}
      <ErrorProvider> {/* 🌟 AGREGADO: Envoltura para interceptar errores de red/sesión */}
        <AuthProvider> {/* Envoltura de Seguridad y Estado de Sesión */}
          <CajaSesionProvider>
            <App />
          </CajaSesionProvider>
        </AuthProvider>
      </ErrorProvider>
    </ThemeProvider>
  </StrictMode>,
)