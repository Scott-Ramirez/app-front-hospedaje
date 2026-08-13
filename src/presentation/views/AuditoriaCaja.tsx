import React, { useEffect, useState } from 'react';
import { cajaSesionRepository } from '../../data/repositories/cajaSesion.repository';
import type { CajaSesionResponse } from '../../data/repositories/cajaSesion.repository';
import { Wallet, Loader2, ArrowLeft, ArrowRight, User, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertAdapter } from '../../core/adapters/alert.adapter';

export const AuditoriaCaja: React.FC = () => {
  const { usuario } = useAuth();
  const esAdminOSupervisor = usuario?.rol === 'admin' || usuario?.rol === 'supervisor';

  const [turnos, setTurnos] = useState<CajaSesionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Estados para modal de conciliación
  const [selectedConciliarId, setSelectedConciliarId] = useState<string | null>(null);
  const [notasConciliacion, setNotasConciliacion] = useState('');
  const [savingConciliacion, setSavingConciliacion] = useState(false);

  const limit = 10;

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const res = await cajaSesionRepository.obtenerHistorial(page, limit);
      setTurnos(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Error al cargar historial de turnos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const handleConciliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConciliarId || !notasConciliacion.trim()) return;

    try {
      setSavingConciliacion(true);
      await cajaSesionRepository.conciliar(selectedConciliarId, notasConciliacion.trim());
      AlertAdapter.success('Éxito', 'El descuadre de caja ha sido conciliado correctamente.');
      setSelectedConciliarId(null);
      setNotasConciliacion('');
      fetchTurnos();
    } catch (err: any) {
      AlertAdapter.error('Error', err?.response?.data?.message || 'No se pudo conciliar el descuadre.');
    } finally {
      setSavingConciliacion(false);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-on-surface space-y-6 select-none animate-fade-in">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-bold tracking-tight">Auditoría de Turnos y Caja</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Consulte y audite las aperturas, cierres, descuadres y conciliaciones de caja del personal de recepción.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-on-surface-variant font-medium">Cargando bitácora de caja...</p>
        </div>
      ) : turnos.length === 0 ? (
        <div className="bg-surface-lowest border border-outline-variant p-16 text-center rounded-3xl flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 bg-surface-container-high rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-on-surface-variant" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Sin registros de turnos</h3>
            <p className="text-xs text-on-surface-variant max-w-[320px] leading-relaxed mx-auto">
              Aún no se han registrado sesiones de apertura o cierre de caja en el sistema.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabla */}
          <div className="bg-surface-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60 font-bold text-on-surface-variant">
                    <th className="p-4">Operador</th>
                    <th className="p-4">Apertura</th>
                    <th className="p-4">Cierre</th>
                    <th className="p-4 text-right">Inicial (Base)</th>
                    <th className="p-4 text-right">Efectivo (+)</th>
                    <th className="p-4 text-right">Gastos (-)</th>
                    <th className="p-4 text-right">Yape/Plin (★)</th>
                    <th className="p-4 text-right">Entregado</th>
                    <th className="p-4 text-right">Arqueo (Descuadre)</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Acciones / Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/35 font-medium">
                  {turnos.map((t) => {
                    const descVal = Number(t.descuadre || 0);
                    const esCerrada = t.estado === 'cerrada';
                    const tieneDescuadre = esCerrada && Math.abs(descVal) >= 0.01;
                    const esConciliado = t.conciliado;

                    return (
                      <tr key={t.id} className="hover:bg-surface-container-lowest/40 transition-colors">
                        {/* Operador */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {t.usuario?.username?.substring(0, 2) || 'RX'}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface capitalize">{t.usuario?.nombre || 'Recepcionista'}</p>
                              <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">{t.usuario?.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Apertura */}
                        <td className="p-4 text-[10px] text-on-surface-variant">
                          <p>{new Date(t.fecha_apertura).toLocaleDateString()}</p>
                          <p className="font-bold mt-0.5">{new Date(t.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>

                        {/* Cierre */}
                        <td className="p-4 text-[10px] text-on-surface-variant">
                          {t.fecha_cierre ? (
                            <>
                              <p>{new Date(t.fecha_cierre).toLocaleDateString()}</p>
                              <p className="font-bold mt-0.5">{new Date(t.fecha_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </>
                          ) : (
                            <span className="text-amber-500 font-bold uppercase tracking-wider">Activo</span>
                          )}
                        </td>

                        {/* Montos */}
                        <td className="p-4 text-right font-mono">S/. {Number(t.monto_inicial).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-emerald-600">S/. {Number(t.monto_ingresos_efectivo || 0).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-error">S/. {Number(t.monto_egresos).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-blue-600">S/. {Number(t.monto_ingresos_digital || 0).toFixed(2)}</td>
                        
                        <td className="p-4 text-right font-mono font-bold">
                          {t.monto_real_entregado !== null && t.monto_real_entregado !== undefined ? (
                            `S/. ${Number(t.monto_real_entregado).toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Descuadre Arqueo */}
                        <td className="p-4 text-right">
                          {esCerrada ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black text-[11px] ${
                              Math.abs(descVal) < 0.01
                                ? 'bg-green-500/10 text-green-600'
                                : descVal < 0
                                ? 'bg-error/10 text-error animate-pulse'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {descVal >= 0 ? '+' : ''}{descVal.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/40 font-mono">-</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="p-4">
                          {t.estado === 'abierta' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                              Activa (Abierta)
                            </span>
                          ) : !tieneDescuadre ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                              Cuadrado
                            </span>
                          ) : esConciliado ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 border border-sky-500/20" title={`Conciliado por ${t.conciliado_por}`}>
                              Conciliado
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20">
                              No Conciliado
                            </span>
                          )}
                        </td>

                        {/* Acciones / Auditoría */}
                        <td className="p-4 text-center">
                          {esCerrada && tieneDescuadre ? (
                            !esConciliado ? (
                              esAdminOSupervisor ? (
                                <button
                                  onClick={() => setSelectedConciliarId(t.id)}
                                  className="px-2.5 py-1 bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                                >
                                  Conciliar
                                </button>
                              ) : (
                                <span className="text-[10px] text-red-500/80 font-bold flex items-center justify-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Pendiente Admin
                                </span>
                              )
                            ) : (
                              <div 
                                className="text-[10px] text-on-surface-variant font-medium max-w-[160px] truncate mx-auto bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40"
                                title={`Notas: "${t.notas_conciliacion}" (Aprobado por: ${t.conciliado_por})`}
                              >
                                <span className="font-bold text-sky-600">Ajustado:</span> {t.notas_conciliacion}
                              </div>
                            )
                          ) : (
                            <span className="text-on-surface-variant/40 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas / Observaciones Recientes */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">Comentarios y Bitácoras de Entrega</h4>
            <div className="space-y-3">
              {turnos.filter(t => t.observaciones).slice(0, 3).map(t => (
                <div key={t.id} className="bg-surface-lowest border border-outline-variant/40 p-3 rounded-xl flex gap-3.5 items-start">
                  <div className="p-2 bg-surface-container-high rounded-lg text-on-surface-variant">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-on-surface flex items-center gap-2">
                      <span className="capitalize">{t.usuario?.nombre}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">({new Date(t.fecha_apertura).toLocaleDateString()})</span>
                    </p>
                    <p className="text-on-surface-variant font-medium italic">"{t.observaciones}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs px-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <span className="font-bold text-on-surface-variant">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>
      )}

      {/* Modal de Conciliación de Descuadre */}
      {selectedConciliarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface text-on-surface w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-black text-sm text-on-surface">Conciliar Descuadre de Caja</h3>
              </div>
              <button 
                onClick={() => setSelectedConciliarId(null)}
                className="h-8 w-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Body */}
            <form onSubmit={handleConciliar} className="p-6 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 text-xs text-amber-600 dark:text-amber-400 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold">Acción de Auditoría:</p>
                  <p className="mt-0.5 leading-relaxed">
                    Al confirmar, registrarás que revisaste este turno y el descuadre contable quedará aclarado. Debes justificar el ajuste.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Notas de Ajuste / Justificación
                </label>
                <textarea
                  required
                  placeholder="Ej. Faltante aclarado. El recepcionista cometió un error de digitación al ingresar un cobro. No hay pérdida real de efectivo."
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none font-medium"
                  value={notasConciliacion}
                  onChange={(e) => setNotasConciliacion(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedConciliarId(null)}
                  className="flex-1 py-2.5 bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConciliacion || !notasConciliacion.trim()}
                  className="flex-1 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingConciliacion ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Confirmar Conciliación'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditoriaCaja;
