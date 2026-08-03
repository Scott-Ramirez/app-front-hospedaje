export type RolUsuario = 'admin' | 'supervisor' | 'recepcionista';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface SesionUsuario {
  access_token: string;
  debeChangiarPassword: boolean;
  usuario: Usuario;
}