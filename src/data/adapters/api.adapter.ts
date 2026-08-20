import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { GlobalErrorDetail } from '../../presentation/context/ErrorContext';

// Configuramos la URL base apuntando a tu API de NestJS usando variables de entorno
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // 🌟 CLAVE: Esto le dice a ngrok que salte la pantalla de advertencia interna
    // y envíe la petición directo a NestJS, evitando el falso error de CORS.
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor: Inyecta el token de forma automática y limpia en cada petición
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('hospedaje_token') || localStorage.getItem('hospedaje_token');
    
    // Evitamos que la palabra "undefined" o "null" en string rompa el JwtAuthGuard de NestJS
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🌟 Mecanismo para notificar errores de forma global hacia el contexto
let errorCallback: (errorDetail: GlobalErrorDetail) => void = () => {};

export const injectErrorNotifier = (callback: (errorDetail: GlobalErrorDetail) => void) => {
  errorCallback = callback;
};

// Número máximo de reintentos silenciosos automáticos ante micro-cortes de red/DNS
const MAX_RETRIES = 2;

// 🌟 Interceptor de respuestas con Auto-Retry transparente
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const config = error.config as (InternalAxiosRequestConfig & { __retryCount?: number }) | undefined;

    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.toLowerCase().includes('network error');

    // 🔄 Auto-reintento silencioso si fue un fallo momentáneo de red/DNS (hasta 2 intentos)
    if (isNetworkError && config) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delayMs = config.__retryCount * 700; // 700ms en 1er intento, 1400ms en 2do intento
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(config);
      }
    }

    let mensajeError = error.response?.data?.message || error.message || 'Error de conexión';
    
    // Normalizamos el mensaje en caso de ser un arreglo (ej: validaciones de DNI, etc.)
    if (Array.isArray(mensajeError)) {
      mensajeError = mensajeError.join(', ');
    }

    const isServerError = error.response && error.response.status >= 500;
    const isTokenExpired = error.response && error.response.status === 401 && !window.location.pathname.includes('/login');

    if (isNetworkError) {
      if (errorCallback) {
        errorCallback({ message: mensajeError, type: 'network' });
      }
    } else if (isServerError) {
      if (errorCallback) {
        errorCallback({ message: mensajeError, type: 'server' });
      }
    } else if (isTokenExpired) {
      if (errorCallback) {
        errorCallback({ message: mensajeError, type: 'auth' });
      }
    }
    
    return Promise.reject(error);
  }
);