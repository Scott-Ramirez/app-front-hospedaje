# Rayza Hotel - Sistema de Gestión de Hospedaje (Frontend)

Este repositorio contiene la interfaz de usuario (Frontend) para la aplicación de gestión de hospedajes del hotel. Desarrollado con una interfaz premium, moderna, responsiva, con micro-animaciones y soporte para modo claro/oscuro.

---

## 🚀 Características Principales

* **Dashboard de Habitaciones**: Visualización en tiempo real del estado de cada habitación (Disponible, Ocupada, Limpieza, Mantenimiento) con accesos rápidos.
* **Control de Caja Chica (Turnos)**: Guardián de ruta que obliga al recepcionista a declarar su saldo inicial y gestionar cobros y egresos únicamente con una sesión de caja abierta.
* **Flujo de Check-In & Check-Out**: Modales rápidos con cálculo automático de saldos y búsqueda predictiva de huéspedes por DNI/Documento.
* **Centro de Notificaciones en Tiempo Real (WebSockets)**:
  * Alertas de finalización de estancia y solicitud de limpieza.
  * Solicitudes de egresos/retiro de dinero en tiempo real del recepcionista al administrador.
  * Aprobación/Rechazo de egresos reflejado instantáneamente en el dashboard del recepcionista con sonido sutil de chime.
* **Módulo de Reportes Visuales**: Gráficos e indicadores de ocupación, balances de ingresos, egresos, y desglose por método de pago (Efectivo, Yape, Plin, Transferencia).
* **Gestión de Auditoría (Bitácora)**: Acceso restringido para Administradores y Supervisores donde se detallan todas las acciones del personal.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Core**: React 18 & Vite
* **Lenguaje**: TypeScript
* **Estilizado**: Tailwind CSS v4 & Tailwind Variables
* **Librería de Iconos**: Lucide React
* **Comunicación en Tiempo Real**: Socket.IO Client (con soporte ngrok-headers y polling fallback)
* **Peticiones HTTP**: Axios (con interceptores automáticos para inyección de Token JWT)

---

## ⚙️ Configuración del Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto para apuntar a la dirección del servidor backend:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_VERSION=v1.0.0
```

---

## 📦 Instrucciones de Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   *La aplicación abrirá por defecto en `http://localhost:5173`.*

3. **Compilar para producción**:
   ```bash
   npm run build
   ```
   *Genera los archivos optimizados dentro de la carpeta `/dist` listos para ser servidos.*
