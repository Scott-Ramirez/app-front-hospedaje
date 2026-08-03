import type { IAuthRepository } from '../../core/interfaces/auth-repository.interface';
import type { SesionUsuario, RolUsuario } from '../../core/entities/usuario.entity';
import { api } from '../adapters/api.adapter';

export class AuthRepository implements IAuthRepository {
  
  async login(username: string, password: string): Promise<SesionUsuario> {
    // Le pega al endpoint exacto consumiendo el adaptador centralizado
    const { data } = await api.post<SesionUsuario>('/auth/login', {
      username,
      password,
    });
    return data;
  }

  async solicitarRecuperacion(username: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/recuperar-password', {
      username,
    });
    return data;
  }

  async cambiarPassword(passwordActual: string, nuevaPassword: string): Promise<{ mensaje: string }> {
    const { data } = await api.patch<{ mensaje: string }>('/auth/cambiar-password', {
      passwordActual,
      nuevaPassword,
    });
    return data;
  }

  async registrarUsuario(username: string, clave: string, nombre: string, rol: RolUsuario): Promise<any> {
    const { data } = await api.post<any>('/auth/usuarios/registro', {
      username,
      clave,
      nombre,
      rol,
    });
    return data;
  }

  async resetPasswordUsuario(id: number, nuevaClaveTemporal: string): Promise<{ mensaje: string; usuarioId: number }> {
    const { data } = await api.patch<{ mensaje: string; usuarioId: number }>(`/auth/usuarios/${id}/reset-password`, {
      nuevaClaveTemporal,
    });
    return data;
  }

  async listarUsuarios(): Promise<any[]> {
    const { data } = await api.get<any[]>('/auth/usuarios');
    return data;
  }

  async cambiarEstadoUsuario(id: number, activo: boolean): Promise<any> {
    const { data } = await api.patch<any>(`/auth/usuarios/${id}/estado`, {
      activo,
    });
    return data;
  }
}