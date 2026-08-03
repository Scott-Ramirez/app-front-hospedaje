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

    // 📣 El recepcionista recibe confirmación de su propia solicitud
    socket.on('solicitud.egreso.resuelta', (data: { estado: string; recepcionistaId: number; aprobadoPor?: string; rechazadoPor?: string; monto: number; concepto: string; timestamp: string }) => {
      console.log('📣 WebSocket recibido: solicitud.egreso.resuelta', data);
      const currentUser = usuarioRef.current;
      console.log('👤 Usuario actual en el cliente:', currentUser);
      
      if (currentUser) {
        // Conversión numérica explícita y segura para evitar fallos por string/number
        const esMismoUsuario = Number(currentUser.id) === Number(data.recepcionistaId);
        const esRecepcionista = currentUser.rol === 'recepcionista';
        
        console.log(`🔍 Evaluando condición: esMismoUsuario=${esMismoUsuario}, esRecepcionista=${esRecepcionista}`);

        if (esMismoUsuario || esRecepcionista) {
          const esAprobado = data.estado === 'aprobado';
          
          // Sincronizar caja chica en segundo plano de inmediato si fue aprobada
          if (esAprobado) {
            verificarCaja(true);
          }

          const nuevaAlerta: AlertaLimpieza = {
            id: Math.random().toString(36).substring(2, 9),
            habitacionNumero: 'CAJA',
            mensaje: esAprobado
              ? `✅ Tu solicitud de egreso (S/. ${Number(data.monto).toFixed(2)} — ${data.concepto}) fue APROBADA por ${data.aprobadoPor}.`
              : `❌ Tu solicitud de egreso (S/. ${Number(data.monto).toFixed(2)} — ${data.concepto}) fue RECHAZADA por ${data.rechazadoPor || 'un administrador'}.`,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };
          
          console.log('🔔 Agregando notificación en tiempo real a la campana:', nuevaAlerta);
          setNotificaciones((prev) => [nuevaAlerta, ...prev]);
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
            audio.volume = 0.5;
            audio.play();
          } catch { /* bloqueado por política del navegador */ }
        }
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