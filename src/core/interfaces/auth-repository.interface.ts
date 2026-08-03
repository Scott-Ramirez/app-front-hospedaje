import type { SesionUsuario, RolUsuario } from '../entities/usuario.entity';

export interface IAuthRepository {
  login(username: string, clave: string): Promise<SesionUsuario>;
  solicitarRecuperacion(username: string): Promise<{ message: string }>;
  cambiarPassword(passwordActual: string, nuevaPassword: string): Promise<{ mensaje: string }>;
  registrarUsuario(username: string, clave: string, nombre: string, rol: RolUsuario): Promise<any>;
  resetPasswordUsuario(id: number, nuevaClaveTemporal: string): Promise<{ mensaje: string; usuarioId: number }>;
  listarUsuarios(): Promise<any[]>;
  cambiarEstadoUsuario(id: number, activo: boolean): Promise<any>;
}