import { useState } from 'react';
import { useEstancias } from '../hooks/useEstancias';
import { CheckInModal } from '../components/shared/CheckInModal';
import { DetalleEstanciaModal } from '../components/shared/DetalleEstanciaModal';
import { 
  DoorOpen, 
  UserPlus, 
  Calendar, 
  User, 
  Loader2, 
  RefreshCw,
  Eye
} from 'lucide-react';

export const EstanciasActivas = () => {
  // Inicializamos nuestro hook en estado 'pendiente' para ver los huéspedes activos en el hotel
  const {
    estancias,
    loading,
    registrarCheckIn,
    procesarCheckOut,
    recargar
  } = useEstancias('pendiente');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEstancia, setSelectedEstancia] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Formateador de fechas para que se vea amigable en el mostrador
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return '---';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVerDetalle = (estancia: any) => {
    setSelectedEstancia(estancia);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* CABECERA DE LA VISTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <DoorOpen className="h-6 w-6" /> Control de Estancias Activas
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Monitoreo en tiempo real de habitaciones ocupadas y registro de ingresos directos.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={recargar}
            disabled={loading}
            className="p-2.5 rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
            title="Actualizar tabla"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-on-primary font-bold px-4 py-2.5 rounded-md text-sm cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Registrar Check-In</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL / TABLA */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading && estancias.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Consultando habitaciones ocupadas...</p>
          </div>
        ) : estancias.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <DoorOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">No hay estancias activas</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Todas las habitaciones están vacías o disponibles en este momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant">
                  <th className="px-6 py-3.5">Habitación</th>
                  <th className="px-6 py-3.5">Huésped / Documento</th>
                  <th className="px-6 py-3.5">Ingreso (Check-In)</th>
                  <th className="px-6 py-3.5">Salida Programada</th>
                  <th className="px-6 py-3.5 text-right">Total a Cobrar</th>
                  <th className="px-6 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {estancias.map((estancia) => (
                  <tr 
                    key={estancia.id} 
                    className="hover:bg-surface-container-lowest transition-colors group"
                  >
                    {/* Número de Habitación */}
                    <td className="px-6 py-4 font-bold text-primary">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs border border-primary/20">
                        Hab. {estancia.habitacion?.numero || '---'}
                      </span>
                    </td>

                    {/* Datos del Huésped */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface flex items-center gap-1">
                          <User className="h-3 w-3 text-on-surface-variant" />
                          {estancia.huesped?.nombre || 'Huésped Anónimo'}
                        </span>
                        <span className="text-xs text-on-surface-variant mt-0.5">
                          DNI: {estancia.huesped?.dni || '---'}
                        </span>
                      </div>
                    </td>

                    {/* Fecha de Entrada */}
                    <td className="px-6 py-4 text-on-surface-variant text-xs">
                      <div className="flex flex-col">
                        <span>{formatFecha(estancia.fecha_entrada)}</span>
                        {estancia.diasTranscurridos !== undefined && (
                          <span className="text-[10px] text-on-surface-variant/80 mt-0.5">
                            Transcurrido: <strong>{estancia.diasTranscurridos} {estancia.diasTranscurridos === 1 ? 'día' : 'días'}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fecha de Salida Programada */}
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-1.5 font-bold ${estancia.estaVencida ? 'text-error animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                          <Calendar className="h-3 w-3" />
                          {formatFecha(estancia.fecha_salida_programada)}
                        </div>
                        {estancia.estaVencida && (
                          <span className="text-[9px] uppercase font-black text-error bg-error-container/20 px-1.5 py-0.5 rounded border border-error/20 w-fit">
                            🚨 Vencida (Sobretiempo)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total a Pagar / Pagado */}
                    <td className="px-6 py-4 text-right font-bold text-on-surface">
                      <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20 font-bold">
                          <span className="text-[10px] mr-1">S/.</span>
                          {Number(estancia.total_pagar).toFixed(2)}
                        </div>
                        {estancia.montoAcumulado !== undefined && (
                          <span className="text-[10px] text-on-surface-variant">
                            Acumulado: S/. {Number(estancia.montoAcumulado).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Botón de Ficha de Detalle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleVerDetalle(estancia)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-xs font-bold transition-all cursor-pointer shadow-sm border border-primary/20"
                        title="Ver ficha de control y cobros de estancia"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL GLOBAL DE REGISTRO */}
      <CheckInModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={registrarCheckIn}
      />

      {/* MODAL GLOBAL DE DETALLES Y COBROS */}
      <DetalleEstanciaModal 
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEstancia(null);
        }}
        estancia={selectedEstancia}
        onCheckOut={procesarCheckOut}
        onRefreshList={recargar}
      />

    </div>
  );
};