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
  marcarComoNoLeida: (id: string) => void;
  eliminarNotificacion: (id: string) => void;
  limpiarTodas: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// 🔊 Sintetizador de audio local e inmediato mediante Web Audio API
const playNotificationSound = (type: 'info' | 'warning' | 'error' = 'info') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    if (type === 'error') {
      // Tono crítico (descuadres graves): dos tonos graves tipo bocina de alarma
      const playBeep = (time: number, freq: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
        osc.start(time);
        osc.stop(time + 0.35);
      };
      playBeep(now, 380);
      playBeep(now + 0.2, 300);
    } else if (type === 'warning') {
      // Advertencia (egresos/alertas de recepción): tono medio de llamada doble
      const playBeep = (time: number, freq: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
        osc.start(time);
        osc.stop(time + 0.25);
      };
      playBeep(now, 520);
      playBeep(now + 0.12, 520);
    } else {
      // Informativo / Limpieza / Conciliación: Tono Ding-Dong premium ascendente
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.start(now);
      osc1.stop(now + 0.35);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6 (Ding-dong rápido)
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    }
  } catch (e) {
    console.warn('AudioContext bloqueado o no soportado:', e);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const { verificarCaja } = useCajaSesion();
  const [notificaciones, setNotificaciones] = useState<AlertaLimpieza[]>([]);
  const usuarioRef = useRef(usuario);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

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
    
    const socket: Socket = io(`${wsUrl}/notificaciones`, {
      transports: ['polling', 'websocket'], 
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    socket.on('connect', () => {
      console.log('📡 Conectado al canal de notificaciones en tiempo real');
    });

    socket.on('notificacion.directa', (data: any) => {
      const currentUser = usuarioRef.current;
      if (currentUser) {
        // Los recepcionistas no reciben notificaciones de bandeja en su sesión
        if (currentUser.rol === 'recepcionista') return;

        const esDestinatario = data.destinatarioRol === 'todos' || data.destinatarioRol === currentUser.rol || currentUser.rol === 'admin';
        if (esDestinatario) {
          const habitacionTag = data.habitacionNumero ? `Hab. ${data.habitacionNumero}` : 'ALERTA';
          const nuevaAlerta: AlertaLimpieza = {
            id: data.id || Math.random().toString(36).substring(2, 9),
            habitacionNumero: habitacionTag,
            mensaje: `${data.titulo} (De: ${data.remitenteNombre}) — ${data.mensaje}`,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };
          setNotificaciones((prev) => [nuevaAlerta, ...prev]);
          playNotificationSound('warning');
        }
      }
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
      playNotificationSound('info');
    });

    socket.on('alerta.recepcionista', (data: { tipo: string; usuario: string; descripcion: string; timestamp: string }) => {
      const currentUser = usuarioRef.current;
      if (currentUser) {
        if (currentUser.rol === 'admin' || currentUser.rol === 'supervisor') {
          const nuevaAlerta: AlertaLimpieza = {
            id: Math.random().toString(36).substring(2, 9), 
            habitacionNumero: 'SISTEMA',
            mensaje: `🚨 Recepción (${data.usuario}): ${data.descripcion}`,
            timestamp: data.timestamp || new Date().toISOString(),
            leido: false,
          };

          setNotificaciones((prev) => [nuevaAlerta, ...prev]);
          playNotificationSound('warning');
        }
      }
    });

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
          playNotificationSound('info');
        }
      }
    });

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
        playNotificationSound('info');
      }
    });

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
          playNotificationSound('info');
        }
      }
    });

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
        playNotificationSound('error');
      }
    });

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
        playNotificationSound('error');
      }
    });

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
        playNotificationSound('info');
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

  const marcarComoNoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: false } : n))
    );
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  const limpiarTodas = () => {
    setNotificaciones([]);
  };

  return (
    <NotificationContext.Provider value={{ notificaciones, conteoNoLeidas, marcarComoLeida, marcarComoNoLeida, eliminarNotificacion, limpiarTodas }}>
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