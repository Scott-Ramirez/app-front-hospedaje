import React, { useEffect, useState } from 'react';
import { cajaSesionRepository } from '../../data/repositories/cajaSesion.repository';
import type { CajaSesionResponse } from '../../data/repositories/cajaSesion.repository';
import { Wallet, Loader2, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuditoriaCaja: React.FC = () => {
  const [turnos, setTurnos] = useState<CajaSesionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-on-surface space-y-6 select-none">
      
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
            Consulte y audite las aperturas, cierres y descuadres de caja declarados por el personal de recepción.
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
                    <th className="p-4 text-right">Cobros (+)</th>
                    <th className="p-4 text-right">Gastos (-)</th>
                    <th className="p-4 text-right">Entregado</th>
                    <th className="p-4 text-right">Arqueo (Descuadre)</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/35 font-medium">
                  {turnos.map((t) => {
                    const descVal = Number(t.descuadre || 0);
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
                        <td className="p-4 text-right font-mono text-emerald-600">S/. {Number(t.monto_ingresos).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-error">S/. {Number(t.monto_egresos).toFixed(2)}</td>
                        
                        <td className="p-4 text-right font-mono font-bold">
                          {t.monto_real_entregado !== null && t.monto_real_entregado !== undefined ? (
                            `S/. ${Number(t.monto_real_entregado).toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Descuadre Arqueo */}
                        <td className="p-4 text-right">
                          {t.estado === 'cerrada' ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black text-[11px] ${
                              Math.abs(descVal) < 0.01
                                ? 'bg-green-500/10 text-green-600'
                                : descVal < 0
                                ? 'bg-error/10 text-error'
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
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.estado === 'abierta'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/60'
                          }`}>
                            {t.estado}
                          </span>
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

    </div>
  );
};

export default AuditoriaCaja;
