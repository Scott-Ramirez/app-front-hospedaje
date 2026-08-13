import { useState } from 'react';
import { useEstancias } from '../hooks/useEstancias';
import { CheckInModal } from '../components/shared/CheckInModal';
import { DetalleEstanciaModal } from '../components/shared/DetalleEstanciaModal';
import { 
  DoorOpen, 
  UserPlus, 
  Loader2, 
  RefreshCw,
  Eye,
  BedDouble,
  AlertTriangle,
  CheckCircle2,
  Clock3
} from 'lucide-react';

export const EstanciasActivas = () => {
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

  const formatFechaCorta = (fechaStr: string) => {
    if (!fechaStr) return '---';
    return new Date(fechaStr).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleVerDetalle = (estancia: any) => {
    setSelectedEstancia(estancia);
    setIsDetailModalOpen(true);
  };

  const totalVencidas = estancias.filter(e => {
    const montoAcum = Number(e.montoAcumulado ?? 0);
    const pagado = Number(e.total_pagar || 0);
    return Boolean(e.estaVencida) && (montoAcum - pagado) > 0;
  }).length;

  return (
    <div className="space-y-5">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <DoorOpen className="h-4.5 w-4.5 text-primary" />
            </span>
            Estancias Activas
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 ml-10.5">
            {estancias.length} {estancias.length === 1 ? 'habitación ocupada' : 'habitaciones ocupadas'}
            {totalVencidas > 0 && (
              <span className="ml-2 text-red-500 font-semibold">· {totalVencidas} con saldo pendiente</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => recargar()}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Check-In</span>
          </button>
        </div>
      </div>

      {/* TABLA / CONTENIDO */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading && estancias.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-on-surface-variant">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Cargando estancias...</p>
          </div>
        ) : estancias.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BedDouble className="h-7 w-7 text-primary/60" />
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">Sin estancias activas</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Todas las habitaciones están disponibles.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-xs font-semibold text-on-surface-variant bg-surface-container-low">
                  <th className="px-5 py-3.5 whitespace-nowrap">Hab.</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Huésped / DNI</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Check-In</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Días</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Saldo Pendiente</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estancias.map((estancia) => {
                  const montoAcum = Number(estancia.montoAcumulado ?? 0);
                  const pagado = Number(estancia.total_pagar || 0);
                  const deuda = Math.max(0, montoAcum - pagado);
                  const vencida = Boolean(estancia.estaVencida) && deuda > 0;
                  const dias = estancia.diasTranscurridos ?? 1;

                  return (
                    <tr
                      key={estancia.id}
                      className={`border-b border-outline-variant/50 last:border-0 transition-colors hover:bg-surface-container/60 ${vencida ? 'bg-red-500/[0.04]' : ''}`}
                    >
                      {/* Habitación */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-bold text-primary text-sm">
                          <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black">
                            {estancia.habitacion?.numero || '?'}
                          </span>
                        </span>
                      </td>

                      {/* Huésped */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-on-surface text-sm leading-tight">
                          {estancia.huesped?.nombre || 'Anónimo'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                          {estancia.huesped?.dni || '---'}
                        </p>
                      </td>

                      {/* Check-In */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-on-surface font-medium">
                          {formatFechaCorta(estancia.fecha_entrada)}
                        </p>
                      </td>

                      {/* Días */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant">
                          <Clock3 className="h-3 w-3" />
                          {dias}d
                        </span>
                      </td>

                      {/* Saldo */}
                      <td className="px-5 py-3.5 text-right">
                        {deuda > 0 ? (
                          <div>
                            <p className="text-sm font-bold text-red-500">S/. {deuda.toFixed(2)}</p>
                            <p className="text-[10px] text-on-surface-variant">de S/. {montoAcum.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">S/. 0.00</p>
                            <p className="text-[10px] text-on-surface-variant">pagado</p>
                          </div>
                        )}
                      </td>

                      {/* Estado chip */}
                      <td className="px-5 py-3.5 text-center">
                        {vencida ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Vencida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Al día
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleVerDetalle(estancia)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary transition-all cursor-pointer border border-primary/20 text-xs font-semibold"
                          title="Ver detalle y registrar cobros"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CheckInModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={registrarCheckIn}
      />

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