// src/core/adapters/alert.adapter.ts
import Swal from 'sweetalert2';

export const AlertAdapter = {
    /**
     * Notificación rápida tipo Toast (Esquina superior derecha)
     */
    toast: (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        Toast.fire({ icon, title });
    },

    /**
     * Alerta modal de éxito estandarizada
     */
    success: (title: string, text?: string) => {
        Swal.fire({
            icon: 'success',
            title,
            text,
            confirmButtonColor: '#3085d6', // Puedes cambiarlo por el color de tu variable --primary
            confirmButtonText: 'Aceptar'
        });
    },

    /**
     * Alerta modal de error estandarizada
     */
    error: (title: string, text?: string) => {
        Swal.fire({
            icon: 'error',
            title,
            text,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Cerrar'
        });
    },

    /**
     * Confirmación imperativa antes de realizar acciones críticas (como eliminar)
     */
    confirm: async (title: string, text: string, confirmButtonText = 'Sí, eliminar'): Promise<boolean> => {
        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText,
            cancelButtonText: 'Cancelar',
            reverseButtons: true // Pone el botón de cancelar a la izquierda
        });
        return result.isConfirmed;
    }
};