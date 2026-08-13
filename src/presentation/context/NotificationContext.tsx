import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client'; // 🌟 Solución a la regla "verbatimModuleSyntax"
import { useAuth } from './AuthContext';
import { useCajaSesion } from './CajaSesionContext';

export interface AlertaLimpieza {
  id: string; 
  habitacionNumero: string;
  mensaje: string;
  timestamp: string;
  leido: boolean;
}

interface NotificationContextProps {
  notificaciones: AlertaLimpieza[];
  conteoNoLeidas: number;
  marcarComoLeida: (id: string) => void;
  limpiarTodas: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { verificarCaja } = useCajaSesion();
  const [notificaciones, setNotificaciones] = useState<AlertaLimpieza[]>([]);
  const usuarioRef = useRef(usuario);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  // Cargar notificaciones del localStorage del usuario al montar o cambiar usuario
  useEffect(() => {
    if (usuario) {
      const storageKey = `alertas_notificaciones_${usuario.id}`;
      const guardadas = localStorage.getItem(storageKey);
      if (guardadas) {
        try {
          setNotificaciones(JSON.parse(guardadas));
        } catch {
          setNotificaciones([]);
        }
      } else {
        setNotificaciones([]);
      }
    } else {
      setNotificaciones([]);
    }
  }, [usuario]);

  // Guardar notificaciones en localStorage al cambiar
  useEffect(() => {
    if (usuario) {
      const storageKey = `alertas_notificaciones_${usuario.id}`;
      localStorage.setItem(storageKey, JSON.stringify(notificaciones));
    }
  }, [notificaciones, usuario]);

  const getWebSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return apiUrl.replace('/api/v1', '');
  };

  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    
    // 🌟 CORRECCIÓN CRÍTICA: extraHeaders solo funciona si dejas que HTTP haga el handshake inicial.
    // Si fuerzas ['websocket'] de golpe, el navegador usa la API nativa de WebSocket y ignora los extraHeaders.
    // Al usar ['polling', 'websocket'], ngrok recibe la cabecera en el primer HTTP request y luego muta a WebSocket.
    const socket: Socket = io(`${wsUrl}/notificaciones`, {
      transports: ['polling', 'websocket'], 
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    socket.on('connect', () => {
      console.log('📡 Conectado al canal de notificaciones en tiempo real');
    });

    socket.on('alerta.limpieza', (data: { habitacionNumero: string; mensaje: string; timestamp: string }) => {
      const nuevaAlerta: AlertaLimpieza = {
        id: Math.random().toString(36).substring(2, 9), 
        habitacionNumero: data.habitacionNumero,
        mensaje: data.mensaje,
        timestamp: data.timestamp,
        leido: false,
      };

      setNotificaciones((prev) => [nuevaAlerta, ...prev]);

      // Reproducir sonido sutil de recepción
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
        audio.volume = 0.4;
        audio.play();
      } catch (e) {
        console.log('Sonido bloqueado por políticas de interacción del navegador.');
      }
    });

    socket.on('alerta.recepcionista', (data: { tipo: string; usuario: string; descripcion: string; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (currentUser) {
        // Alerta en tiempo real para Administradores y Supervisores
        if (currentUser.rol === 'admin' || currentUser.rol === 'supervisor') {
          const nuevaAlerta: AlertaLimpieza = {
            id: Math.random().toString(36).substring(2, 9), 
            habitacionNumero: 'SISTEMA',
            mensaje: `🚨 Recepción (${data.usuario}): ${data.descripcion}`,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };

          setNotificaciones((prev) => [nuevaAlerta, ...prev]);

          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
            audio.volume = 0.5;
            audio.play();
          } catch (e) {
            console.log('Sonido bloqueado.');
          }
        }
      }
    });

    // 💸 Solicitudes de egreso de recepcionistas → notifica a admin y supervisor
    socket.on('solicitud.egreso.nueva', (data: { recepcionista: string; monto: number; concepto: string; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (currentUser) {
        if (currentUser.rol === 'admin' || currentUser.rol === 'supervisor') {
          const nuevaAlerta: AlertaLimpieza = {
            id: Math.random().toString(36).substring(2, 9),
            habitacionNumero: 'EGRESO',
            mensaje: `💸 ${data.recepcionista} solicita egreso de S/. ${Number(data.monto).toFixed(2)} — ${data.concepto}`,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };
          setNotificaciones((prev) => [nuevaAlerta, ...prev]);
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
            audio.volume = 0.6;
            audio.play();
          } catch { /* bloqueado por política del navegador */ }
        }
      }
    });

    // 📣 El recepcionista recibe pre-aprobación de su solicitud (Paso 1)
    socket.on('solicitud.egreso.pre_aprobada', (data: { id: string; recepcionistaId: number; aprobadoPor: string; monto: number; concepto: string; timestamp: string }) => {
      console.log('📣 WebSocket recibido: solicitud.egreso.pre_aprobada', data);
      const currentUser = usuarioRef.current;
      if (currentUser && (Number(currentUser.id) === Number(data.recepcionistaId) || currentUser.rol === 'recepcionista')) {
        const nuevaAlerta: AlertaLimpieza = {
          id: Math.random().toString(36).substring(2, 9),
          habitacionNumero: 'CAJA',
          mensaje: `✅ Tu solicitud de egreso (S/. ${Number(data.monto).toFixed(2)} — ${data.concepto}) fue PRE-APROBADA por ${data.aprobadoPor}. Puedes realizar la compra y adjuntar la boleta.`,
          timestamp: data.timestamp || new Date().toISOString(),
          leido: false,
        };
        setNotificaciones((prev) => [nuevaAlerta, ...prev]);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
          audio.volume = 0.5;
          audio.play();
        } catch {}
      }
    });

    // 📣 El recepcionista recibe confirmación de liquidación (Paso 2) o rechazo
    socket.on('solicitud.egreso.resuelta', (data: { estado: string; recepcionistaId: number; aprobadoPor?: string; rechazadoPor?: string; monto?: number; montoReal?: number; concepto: string; timestamp: string }) => {
      console.log('📣 WebSocket recibido: solicitud.egreso.resuelta', data);
      const currentUser = usuarioRef.current;
      
      if (currentUser) {
        const esMismoUsuario = Number(currentUser.id) === Number(data.recepcionistaId);
        const esRecepcionista = currentUser.rol === 'recepcionista';

        if (esMismoUsuario || esRecepcionista) {
          const esLiquidado = data.estado === 'liquidado';
          
          if (esLiquidado) {
            verificarCaja(true);
          }

          const montoMostrar = esLiquidado ? (data.montoReal ?? data.monto ?? 0) : (data.monto ?? 0);
          const mensajeTexto = esLiquidado
            ? `✅ Tu solicitud de egreso (${data.concepto}) fue LIQUIDADA por S/. ${Number(montoMostrar).toFixed(2)} por ${data.aprobadoPor}. Gasto registrado en caja.`
            : `❌ Tu solicitud de egreso (${data.concepto} — S/. ${Number(montoMostrar).toFixed(2)}) fue RECHAZADA por ${data.rechazadoPor || 'un administrador'}.`;

          const nuevaAlerta: AlertaLimpieza = {
            id: Math.random().toString(36).substring(2, 9),
            habitacionNumero: 'CAJA',
            mensaje: mensajeTexto,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };
          
          setNotificaciones((prev) => [nuevaAlerta, ...prev]);
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
            audio.volume = 0.5;
            audio.play();
          } catch {}
        }
      }
    });

    // 💰 Notificación de descuadre de caja al cerrar turno
    socket.on('caja.descuadre_cierre', (data: { usuario: string; montoEsperado: number; montoReal: number; descuadre: number; observaciones: string; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'supervisor')) {
        const nuevaAlerta: AlertaLimpieza = {
          id: Math.random().toString(36).substring(2, 9),
          habitacionNumero: 'AUDITORÍA',
          mensaje: `🚨 Descuadre en Cierre de Caja: ${data.usuario} declaró S/. ${data.montoReal.toFixed(2)} (esperado S/. ${data.montoEsperado.toFixed(2)}). Descuadre: S/. ${data.descuadre.toFixed(2)}`,
          timestamp: data.timestamp || new Date().toISOString(),
          leido: false,
        };
        setNotificaciones((prev) => [nuevaAlerta, ...prev]);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
          audio.volume = 0.6;
          audio.play();
        } catch {}
      }
    });

    // 💰 Notificación de discrepancia en traspaso de caja al abrir turno
    socket.on('caja.descuadre_traspaso', (data: { usuario: string; montoDeclarado: number; montoAnterior: number; diferencia: number; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'supervisor')) {
        const nuevaAlerta: AlertaLimpieza = {
          id: Math.random().toString(36).substring(2, 9),
          habitacionNumero: 'AUDITORÍA',
          mensaje: `⚠️ Discrepancia de Traspaso: ${data.usuario} declara recibir S/. ${data.montoDeclarado.toFixed(2)}, pero el turno anterior reportó dejar S/. ${data.montoAnterior.toFixed(2)} (Dif: S/. ${data.diferencia.toFixed(2)})`,
          timestamp: data.timestamp || new Date().toISOString(),
          leido: false,
        };
        setNotificaciones((prev) => [nuevaAlerta, ...prev]);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
          audio.volume = 0.5;
          audio.play();
        } catch {}
      }
    });

    // 📣 Notificación al recepcionista y administradores de que una caja fue conciliada
    socket.on('caja.conciliada', (data: { id: string; recepcionistaId: number; recepcionistaNombre?: string; conciliadoPor: string; descuadre: number; notas: string; fechaCierre: string; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (!currentUser) return;

      const esElRecepcionistaAfectado = Number(currentUser.id) === Number(data.recepcionistaId);
      const esAdminOSupervisor = currentUser.rol === 'admin' || currentUser.rol === 'supervisor';

      if (esElRecepcionistaAfectado || esAdminOSupervisor) {
        const descVal = Math.abs(data.descuadre).toFixed(2);
        const fechaStr = data.fechaCierre 
          ? new Date(data.fechaCierre).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) 
          : 'reciente';
        
        const mensajeTexto = esElRecepcionistaAfectado
          ? `✅ Tu descuadre de caja de S/. ${descVal} (${fechaStr}) fue CONCILIADO por ${data.conciliadoPor}. Comentario: "${data.notas}"`
          : `✅ Caja de ${data.recepcionistaNombre || 'Recepcionista'} (Descuadre: S/. ${descVal}, cierre ${fechaStr}) fue CONCILIADA por ${data.conciliadoPor}. Notas: "${data.notas}"`;

        const nuevaAlerta: AlertaLimpieza = {
          id: Math.random().toString(36).substring(2, 9),
          habitacionNumero: esAdminOSupervisor ? 'AUDITORÍA' : 'CAJA',
          mensaje: mensajeTexto,
          timestamp: data.timestamp || new Date().toISOString(),
          leido: false,
        };
        setNotificaciones((prev) => [nuevaAlerta, ...prev]);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
          audio.volume = 0.5;
          audio.play();
        } catch {}
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado de las notificaciones en tiempo real');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const conteoNoLeidas = notificaciones.filter((n) => !n.leido).length;

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
    );
  };

  const limpiarTodas = () => {
    setNotificaciones([]);
  };

  return (
    <NotificationContext.Provider value={{ notificaciones, conteoNoLeidas, marcarComoLeida, limpiarTodas }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
};