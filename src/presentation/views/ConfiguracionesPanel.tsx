import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConfiguracionesRepository } from '../../data/repositories/configuraciones.repository';
import type { ConfiguracionDTO } from '../../data/repositories/configuraciones.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import { Wifi, Clock, Lock, Save, Edit2, RefreshCw, Loader2, Key, X } from 'lucide-react';

const configRepo = new ConfiguracionesRepository();

export const ConfiguracionesPanel: React.FC = () => {
  const { usuario } = useAuth();
  const [configs, setConfigs] = useState<ConfiguracionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  // Para rastrear qué llave se está editando y su valor temporal
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const esAdmin = usuario?.rol === 'admin';
  const esSupervisor = usuario?.rol === 'supervisor';

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const data = await configRepo.listar();
      setConfigs(data);
    } catch (error: any) {
      console.error(error);
      AlertAdapter.error('Error al Cargar', 'No se pudieron recuperar las configuraciones globales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const handleEditClick = (config: ConfiguracionDTO) => {
    // Si es supervisor, solo puede editar wifi_nombre y wifi_clave
    if (esSupervisor && config.llave !== 'wifi_nombre' && config.llave !== 'wifi_clave') {
      AlertAdapter.toast('Acceso restringido: Solo puedes editar datos de Wifi.', 'warning');
      return;
    }
    setEditKey(config.llave);
    setEditValue(config.valor);
  };

  const handleSaveClick = async (llave: string) => {
    if (!editValue.trim()) {
      AlertAdapter.toast('El valor no puede estar vacío.', 'error');
      return;
    }

    try {
      setSavingKey(llave);
      const res = await configRepo.actualizar(llave, editValue);
      AlertAdapter.toast(res.mensaje || 'Configuración guardada.', 'success');
      
      // Actualizar estado local
      setConfigs(prev => prev.map(c => c.llave === llave ? { ...c, valor: editValue } : c));
      setEditKey(null);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'No se pudo guardar la configuración.';
      AlertAdapter.error('Error al Guardar', msg);
    } finally {
      setSavingKey(null);
    }
  };

  const formatKeyName = (key: string) => {
    switch (key) {
      case 'wifi_nombre': return 'Nombre de la Red (SSID)';
      case 'wifi_clave': return 'Contraseña de la Red Wifi';
      case 'checkout_hora': return 'Hora Límite de Check-Out';
      default: return key.replace('_', ' ').toUpperCase();
    }
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('wifi')) return <Wifi className="h-5 w-5 text-primary" />;
    if (key.includes('hora') || key.includes('checkout')) return <Clock className="h-5 w-5 text-amber-500" />;
    return <Key className="h-5 w-5 text-blue-500" />;
  };

  const canEdit = (key: string) => {
    if (esAdmin) return true;
    if (esSupervisor && (key === 'wifi_nombre' || key === 'wifi_clave')) return true;
    return false;
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto text-on-surface space-y-6">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Lock className="h-5 w-5" /> Parámetros del Hospedaje
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Gestión de credenciales de red, tarifas base y reglas horarias del mostrador.
          </p>
        </div>
        
        <button
          onClick={cargarConfiguraciones}
          disabled={loading}
          className="p-2.5 rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
          title="Refrescar configuraciones"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Listado */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden divide-y divide-outline-variant">
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Obteniendo variables de entorno...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant text-sm">
            No se encontraron configuraciones globales en la base de datos.
          </div>
        ) : (
          configs.map((config) => {
            const isEditing = editKey === config.llave;
            const editable = canEdit(config.llave);

            return (
              <div key={config.llave} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-surface-container-lowest">
                
                {/* Llave / Título */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-surface-container rounded-lg shrink-0">
                    {getConfigIcon(config.llave)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">
                      {formatKeyName(config.llave)}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Identificador único: <code className="bg-surface-container px-1 py-0.5 rounded text-[10px]">{config.llave}</code>
                    </p>
                  </div>
                </div>

                {/* Formulario / Valor */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isEditing ? (
                    <input
                      type={config.llave === 'wifi_clave' ? 'text' : 'text'}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      disabled={savingKey === config.llave}
                      className="w-full sm:w-60 rounded-md border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Ingresa valor..."
                    />
                  ) : (
                    <div className="text-sm font-semibold bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-md min-w-[150px] text-on-surface select-all">
                      {config.llave === 'wifi_clave' ? '••••••••' : config.valor}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveClick(config.llave)}
                          disabled={savingKey === config.llave}
                          className="p-2 bg-primary text-on-primary rounded-md hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Guardar cambios"
                        >
                          {savingKey === config.llave ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditKey(null)}
                          disabled={savingKey === config.llave}
                          className="p-2 bg-surface-container-high text-on-surface-variant rounded-md hover:bg-surface-container-highest active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      editable && (
                        <button
                          onClick={() => handleEditClick(config)}
                          className="p-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors cursor-pointer active:scale-95"
                          title="Modificar valor"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}

      </div>
      
      {/* Aviso de restricción */}
      {esSupervisor && (
        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>Nivel de acceso limitado: Como supervisor, solo tienes autorización para editar los parámetros de red Wifi.</span>
        </div>
      )}

    </div>
  );
};