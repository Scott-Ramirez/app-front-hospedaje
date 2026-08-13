import React, { useEffect, useState } from 'react';
import { AuthRepository } from '../../data/repositories/auth.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import type { RolUsuario } from '../../core/entities/usuario.entity';
import { 
  Users, 
  UserPlus, 
  Key, 
  Loader2, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  X,
  UserCheck,
  UserX,
  UserCog,
  Clock
} from 'lucide-react';

const authRepo = new AuthRepository();

export const UsuariosPanel: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registrar usuario
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    username: '',
    clave: '',
    nombre: '',
    rol: 'recepcionista' as RolUsuario,
    tieneHorarioLimitado: false,
    horaInicioTurno: '07:00',
    horaFinTurno: '19:00',
  });
  const [regLoading, setRegLoading] = useState(false);

  // Editar usuario
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    nombre: '',
    rol: 'recepcionista' as RolUsuario,
    tieneHorarioLimitado: false,
    horaInicioTurno: '07:00',
    horaFinTurno: '19:00',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Resetear password
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');
  const [nuevaClaveTemp, setNuevaClaveTemp] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await authRepo.listarUsuarios();
      setUsuarios(data || []);
    } catch (error: any) {
      console.error(error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.username.trim() || !regForm.clave.trim() || !regForm.nombre.trim()) {
      AlertAdapter.toast('Todos los campos son obligatorios', 'error');
      return;
    }

    if (regForm.clave.length < 8) {
      AlertAdapter.toast('La clave inicial debe tener al menos 8 caracteres', 'warning');
      return;
    }

    try {
      setRegLoading(true);
      await authRepo.registrarUsuario(
        regForm.username.trim(),
        regForm.clave.trim(),
        regForm.nombre.trim(),
        regForm.rol,
        regForm.tieneHorarioLimitado ? regForm.horaInicioTurno : null,
        regForm.tieneHorarioLimitado ? regForm.horaFinTurno : null
      );
      AlertAdapter.success('Usuario Creado', `El empleado '${regForm.nombre}' se registró exitosamente.`);
      setShowRegModal(false);
      setRegForm({
        username: '',
        clave: '',
        nombre: '',
        rol: 'recepcionista',
        tieneHorarioLimitado: false,
        horaInicioTurno: '07:00',
        horaFinTurno: '19:00',
      });
      cargarUsuarios();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al registrar al usuario.';
      AlertAdapter.error('Fallo en Registro', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nombre.trim()) {
      AlertAdapter.toast('El nombre es obligatorio', 'error');
      return;
    }

    try {
      setEditLoading(true);
      await authRepo.actualizarUsuario(
        editForm.id,
        editForm.nombre.trim(),
        editForm.rol,
        editForm.tieneHorarioLimitado ? editForm.horaInicioTurno : null,
        editForm.tieneHorarioLimitado ? editForm.horaFinTurno : null
      );
      AlertAdapter.success('Usuario Actualizado', 'Los datos se guardaron correctamente.');
      setShowEditModal(false);
      cargarUsuarios();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al actualizar al usuario.';
      AlertAdapter.error('Fallo en Edición', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (usr: any) => {
    setEditForm({
      id: usr.id,
      nombre: usr.nombre,
      rol: usr.rol,
      tieneHorarioLimitado: !!(usr.horaInicioTurno && usr.horaFinTurno),
      horaInicioTurno: usr.horaInicioTurno || '07:00',
      horaFinTurno: usr.horaFinTurno || '19:00',
    });
    setShowEditModal(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClaveTemp.trim() || resetUserId === null) {
      AlertAdapter.toast('La contraseña temporal es obligatoria', 'error');
      return;
    }

    if (nuevaClaveTemp.length < 8) {
      AlertAdapter.toast('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }

    try {
      setResetLoading(true);
      const res = await authRepo.resetPasswordUsuario(resetUserId, nuevaClaveTemp.trim());
      AlertAdapter.success('Contraseña Restablecida', res.mensaje || `Clave de '${resetUsername}' cambiada con éxito.`);
      setShowResetModal(false);
      setNuevaClaveTemp('');
      setResetUserId(null);
      setResetUsername('');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al restablecer la contraseña.';
      AlertAdapter.error('Fallo de Operación', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setResetLoading(false);
    }
  };

  const openResetModal = (id: number, username: string) => {
    setResetUserId(id);
    setResetUsername(username);
    setNuevaClaveTemp('');
    setShowResetModal(true);
  };

  const handleToggleEstado = async (id: number, username: string, nuevoEstado: boolean) => {
    const actionText = nuevoEstado ? 'reactivar' : 'dar de baja';
    const confirm = await AlertAdapter.confirm(
      'Cambiar estado del usuario',
      `¿Está seguro que desea ${actionText} al usuario '${username}'?`
    );
    if (!confirm) return;

    try {
      setLoading(true);
      await authRepo.cambiarEstadoUsuario(id, nuevoEstado);
      AlertAdapter.toast(
        `Usuario '${username}' ${nuevoEstado ? 'activado' : 'dado de baja'} correctamente.`,
        'success'
      );
      cargarUsuarios();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al cambiar el estado del usuario.';
      AlertAdapter.error('Error', Array.isArray(msg) ? msg.join(', ') : msg);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-on-surface space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestión de Usuarios y Personal
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Registra nuevos recepcionistas y supervisores, asigna turnos y jornadas de trabajo, o gestiona accesos de terminal.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={cargarUsuarios}
            disabled={loading}
            className="p-2.5 rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowRegModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-on-primary font-bold px-4 py-2.5 rounded-md text-sm cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Registrar Empleado</span>
          </button>
        </div>
      </div>

      {/* Listado de Usuarios */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Obteniendo personal del hotel...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant max-w-sm mx-auto space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">No se listan usuarios</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Usa el botón de arriba para registrar nuevos empleados.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant">
                  <th className="px-6 py-3.5 w-16">ID</th>
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Usuario (Username)</th>
                  <th className="px-6 py-3.5">Rol</th>
                  <th className="px-6 py-3.5">Turno Laboral</th>
                  <th className="px-6 py-3.5 text-center">Estado</th>
                  <th className="px-6 py-3.5 text-center w-80">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">#{usr.id}</td>
                    <td className="px-6 py-4 font-bold text-on-surface">{usr.nombre}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{usr.username}</td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold border ${
                        usr.rol === 'admin' 
                          ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                          : usr.rol === 'supervisor' 
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {usr.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">
                      {usr.horaInicioTurno && usr.horaFinTurno ? (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {usr.horaInicioTurno} hrs - {usr.horaFinTurno} hrs
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/60 font-medium">Libre / Sin restricción</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${usr.activo !== false ? 'text-green-600' : 'text-red-500'}`}>
                        {usr.activo !== false ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {usr.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(usr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-outline-variant hover:bg-surface-container-high text-xs font-bold transition-all cursor-pointer shadow-sm text-on-surface-variant"
                          title="Editar datos de usuario"
                        >
                          <UserCog className="h-3.5 w-3.5 text-primary" />
                          <span>Editar</span>
                        </button>
                        
                        <button
                          onClick={() => openResetModal(usr.id, usr.username)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-outline-variant hover:bg-surface-container-high text-xs font-bold transition-all cursor-pointer shadow-sm text-on-surface-variant"
                          title="Restablecer contraseña"
                        >
                          <Key className="h-3.5 w-3.5 text-amber-500" />
                          <span>Clave</span>
                        </button>
                        
                        {usr.activo !== false ? (
                          <button
                            onClick={() => handleToggleEstado(usr.id, usr.username, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-500/20 hover:bg-red-500/5 text-red-500 hover:text-red-600 text-xs font-bold transition-all cursor-pointer shadow-sm"
                            title="Dar de baja a este usuario"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Baja</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleEstado(usr.id, usr.username, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-green-500/20 hover:bg-green-500/5 text-green-600 hover:text-green-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                            title="Reactivar usuario"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Activar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Usuario */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in duration-200">
          <div className="bg-surface text-on-surface w-full max-w-md rounded-xl shadow-xl border border-outline-variant overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="text-lg font-bold text-primary">Registrar Nuevo Empleado</h3>
                <p className="text-xs text-on-surface-variant">El usuario utilizará la clave asignada para iniciar sesión.</p>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MARÍA TORRES"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                  value={regForm.nombre}
                  onChange={(e) => setRegForm({ ...regForm, nombre: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Usuario (Terminal Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. RECEPCION01"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Contraseña de Acceso</label>
                <input
                  type="text"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                  value={regForm.clave}
                  onChange={(e) => setRegForm({ ...regForm, clave: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Rol de Acceso</label>
                <select
                  required
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                  value={regForm.rol}
                  onChange={(e) => setRegForm({ ...regForm, rol: e.target.value as RolUsuario })}
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Nuevos Campos: Turno Laboral */}
              <div className="pt-2 border-t border-outline-variant/60">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regForm.tieneHorarioLimitado}
                    onChange={(e) => setRegForm({ ...regForm, tieneHorarioLimitado: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-on-surface-variant uppercase">Restringir horario de trabajo</span>
                </label>
                
                {regForm.tieneHorarioLimitado && (
                  <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">Hora Inicio</label>
                      <input
                        type="time"
                        required
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={regForm.horaInicioTurno}
                        onChange={(e) => setRegForm({ ...regForm, horaInicioTurno: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">Hora Fin</label>
                      <input
                        type="time"
                        required
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={regForm.horaFinTurno}
                        onChange={(e) => setRegForm({ ...regForm, horaFinTurno: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  disabled={regLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {regLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in duration-200">
          <div className="bg-surface text-on-surface w-full max-w-md rounded-xl shadow-xl border border-outline-variant overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="text-lg font-bold text-primary">Editar Datos del Empleado</h3>
                <p className="text-xs text-on-surface-variant">Modifique las propiedades principales y su rango laboral.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MARÍA TORRES"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Rol de Acceso</label>
                <select
                  required
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                  value={editForm.rol}
                  onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as RolUsuario })}
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Campos: Turno Laboral */}
              <div className="pt-2 border-t border-outline-variant/60">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.tieneHorarioLimitado}
                    onChange={(e) => setEditForm({ ...editForm, tieneHorarioLimitado: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-on-surface-variant uppercase">Restringir horario de trabajo</span>
                </label>
                
                {editForm.tieneHorarioLimitado && (
                  <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">Hora Inicio</label>
                      <input
                        type="time"
                        required
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={editForm.horaInicioTurno}
                        onChange={(e) => setEditForm({ ...editForm, horaInicioTurno: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">Hora Fin</label>
                      <input
                        type="time"
                        required
                        className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={editForm.horaFinTurno}
                        onChange={(e) => setEditForm({ ...editForm, horaFinTurno: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in duration-200">
          <div className="bg-surface text-on-surface w-full max-w-md rounded-xl shadow-xl border border-outline-variant overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="text-lg font-bold text-primary">Restablecer Contraseña</h3>
                <p className="text-xs text-on-surface-variant">Asigna una nueva contraseña de acceso para '{resetUsername}'.</p>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>Esta acción actualizará la contraseña del usuario. El usuario podrá iniciar sesión inmediatamente con esta nueva clave.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                  value={nuevaClaveTemp}
                  onChange={(e) => setNuevaClaveTemp(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
