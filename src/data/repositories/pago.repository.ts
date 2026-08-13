import { api } from '../adapters/api.adapter';

export const pagoRepository = {
  // Sube una imagen de evidencia para un pago en específico
  async subirEvidencia(pagoId: string, formData: FormData): Promise<any> {
    const { data } = await api.patch(`/caja-sesiones/pagos/${pagoId}/evidencia`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Retorna la URL absoluta para desplegar la imagen en el visor
  getEvidenciaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const filename = url.split('/').pop() || '';
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return `${apiBase}/caja-sesiones/pagos/evidencia/${filename}`;
  },
};
