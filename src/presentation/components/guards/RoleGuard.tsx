import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { RolUsuario } from '../../../core/entities/usuario.entity';

interface RoleGuardProps {
  rolesPermitidos: RolUsuario[];
}

export const RoleGuard = ({ rolesPermitidos }: RoleGuardProps) => {
  const { usuario } = useAuth();

  // Si el rol del usuario actual no está en la lista blanca, lo rebotamos al dashboard principal
  if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};