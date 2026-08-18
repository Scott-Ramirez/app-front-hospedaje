import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { HabitacionesRepository } from '../../data/repositories/habitaciones.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import {
  Inbox,
  Star,
  Clock,
  Trash2,
  Search,
  KeyRound,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  MailOpen,
  DoorOpen,
  DollarSign,
  Shield,
  Sparkles,
  X,
  Building,
  CheckCheck
} from 'lucide-react';

const habitacionesRepo = new HabitacionesRepository();

type CategoriaBandeja = 'recibidos' | 'destacados' | 'habitaciones' | 'caja' | 'auditoria' | 'no-leidos' | 'todos';

export const BandejaNotificaciones: React.FC = () => {
  const { notificaciones, marcarComoLeida, marcarComoNoLeida, eliminarNotificacion, limpiarTodas } = useNotifications();
  const { usuario } = useAuth();

  // Estados de navegación y filtros estilo Gmail
  const [categoriaActual, setCategoriaActual] = useState<CategoriaBandeja>('recibidos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroRapido, setFiltroRapido] = useState<'todos' | 'no-leidos' | 'acciones'>('todos');
  
  // Estado de filas expandidas (acordeón)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  
  // Estado de selección múltiple (checkboxes)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // Estado de mensajes destacados (estrellas) persistido en localStorage
  const [destacados, setDestacados] = useState<Set<string>>(() => {
    try {
      const guardados = localStorage.getItem('notificaciones_destacadas');
      return guardados ? new Set(JSON.parse(guardados)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Guardar destacados en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notificaciones_destacadas', JSON.stringify(Array.from(destacados)));
    } catch (e) {
      console.error('Error guardando destacados:', e);
    }
  }, [destacados]);

  // Estado de liberación de habitación
  const [liberandoHab, setLiberandoHab] = useState<string | null>(null);

  // Toggle destacar mensaje
  const toggleDestacado = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDestacados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  // Toggle expandir fila
  const toggleExpandir = (id: string, alertaLeido: boolean) => {
    setExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
        // Si no estaba leído, marcarlo como leído al abrir
        if (!alertaLeido) {
          marcarComoLeida(id);
        }
      }
      return nuevo;
    });
  };

  // Toggle seleccionar checkbox
  const toggleSeleccion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  // Seleccionar / Deseleccionar todos
  const handleToggleSeleccionarTodos = () => {
    if (seleccionados.size === listaFiltrada.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(listaFiltrada.map(n => n.id)));
    }
  };

  // Acciones en lote
  const handleMarcarSeleccionadosLeidos = () => {
    seleccionados.forEach(id => marcarComoLeida(id));
    AlertAdapter.toast(`${seleccionados.size} mensajes marcados como leídos`, 'success');
    setSeleccionados(new Set());
  };

  const handleMarcarSeleccionadosNoLeidos = () => {
    seleccionados.forEach(id => marcarComoNoLeida(id));
    AlertAdapter.toast(`${seleccionados.size} mensajes marcados como no leídos`, 'info');
    setSeleccionados(new Set());
  };

  const handleEliminarSeleccionados = () => {
    seleccionados.forEach(id => eliminarNotificacion(id));
    AlertAdapter.toast(`${seleccionados.size} mensajes eliminados`, 'info');
    setSeleccionados(new Set());
  };

  // Liberar Habitación
  const handleLiberarHabitacion = async (numeroHab: string, alertaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLiberandoHab(numeroHab);
      await habitacionesRepo.liberar(numeroHab);
      AlertAdapter.success('Habitación Liberada', `La habitación N° ${numeroHab} ha sido liberada correctamente y ya está disponible.`);
      marcarComoLeida(alertaId);
    } catch (err: any) {
      AlertAdapter.error('Error al Liberar', err.response?.data?.message || 'No se pudo liberar la habitación.');
    } finally {
      setLiberandoHab(null);
    }
  };

  // Parsear y clasificar el mensaje para estilo correo
  const parsearNotificacion = (n: any) => {
    const esCaja = n.habitacionNumero === 'CAJA' || n.habitacionNumero === 'EGRESO';
    const esAudit = n.habitacionNumero === 'AUDITORÍA' || n.habitacionNumero === 'SISTEMA';
    const esHabitacion = !esCaja && !esAudit;
    const numHab = n.habitacionNumero ? n.habitacionNumero.replace(/\D/g, '') : '';
    const esDestacado = destacados.has(n.id);

    let remitente = 'Sistema Hospedaje';
    let asunto = 'Notificación General';
    let badgeColor = 'bg-primary/10 text-primary border-primary/20';
    let iconoRemitente = <Building className="h-4 w-4 text-primary" />;

    if (esHabitacion) {
      remitente = `Habitación ${numHab || n.habitacionNumero}`;
      asunto = `Alerta de Limpieza / Salida en Habitación ${numHab || n.habitacionNumero}`;
      badgeColor = 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400/60';
      iconoRemitente = <DoorOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    } else if (n.habitacionNumero === 'EGRESO') {
      remitente = 'Módulo de Caja / Egresos';
      asunto = 'Solicitud de Egreso de Caja Chica';
      badgeColor = 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400/60';
      iconoRemitente = <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    } else if (n.habitacionNumero === 'CAJA') {
      remitente = 'Módulo de Caja y Finanzas';
      asunto = 'Movimiento o Cierre de Turno de Caja';
      badgeColor = 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400/60';
      iconoRemitente = <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    } else if (esAudit) {
      remitente = 'Auditoría y Supervisión';
      asunto = 'Conciliación / Auditoría de Turno';
      badgeColor = 'bg-sky-100 text-sky-950 dark:bg-sky-950/60 dark:text-sky-300 border-sky-400/60';
      iconoRemitente = <Shield className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    }

    return {
      ...n,
      remitente,
      asunto,
      badgeColor,
      iconoRemitente,
      esHabitacion,
      esCaja,
      esAudit,
      numHab,
      esDestacado
    };
  };

  // Formato de hora amigable estilo Gmail
  const formatHoraGmail = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      const ahora = new Date();
      const esHoy = fecha.toDateString() === ahora.toDateString();

      if (esHoy) {
        return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      }
      return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    } catch {
      return fechaStr;
    }
  };

  const formatHoraCompleta = (fechaStr: string) => {
    try {
      return new Date(fechaStr).toLocaleString('es-PE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  // Contadores para el menú lateral
  const conteos = useMemo(() => {
    const total = notificaciones.length;
    const noLeidos = notificaciones.filter(n => !n.leido).length;
    const dest = notificaciones.filter(n => destacados.has(n.id)).length;
    const habs = notificaciones.filter(n => n.habitacionNumero !== 'CAJA' && n.habitacionNumero !== 'EGRESO' && n.habitacionNumero !== 'AUDITORÍA' && n.habitacionNumero !== 'SISTEMA').length;
    const caja = notificaciones.filter(n => n.habitacionNumero === 'CAJA' || n.habitacionNumero === 'EGRESO').length;
    const audit = notificaciones.filter(n => n.habitacionNumero === 'AUDITORÍA' || n.habitacionNumero === 'SISTEMA').length;

    return { total, noLeidos, dest, habs, caja, audit };
  }, [notificaciones, destacados]);

  // Filtrado de la lista
  const listaFiltrada = useMemo(() => {
    return notificaciones
      .map(parsearNotificacion)
      .filter(item => {
        // 1. Filtro por carpeta lateral
        if (categoriaActual === 'recibidos' && item.esHabitacion === false && item.esCaja === false && item.esAudit === false) return true;
        if (categoriaActual === 'destacados' && !item.esDestacado) return false;
        if (categoriaActual === 'no-leidos' && item.leido) return false;
        if (categoriaActual === 'habitaciones' && !item.esHabitacion) return false;
        if (categoriaActual === 'caja' && !item.esCaja) return false;
        if (categoriaActual === 'auditoria' && !item.esAudit) return false;

        // 2. Filtro rápido superior
        if (filtroRapido === 'no-leidos' && item.leido) return false;
        if (filtroRapido === 'acciones' && !item.esHabitacion) return false;

        // 3. Búsqueda por texto (remitente, asunto, mensaje o habitación)
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase();
          const coincide =
            item.remitente.toLowerCase().includes(q) ||
            item.asunto.toLowerCase().includes(q) ||
            item.mensaje.toLowerCase().includes(q) ||
            (item.habitacionNumero && item.habitacionNumero.toLowerCase().includes(q));
          if (!coincide) return false;
        }

        return true;
      });
  }, [notificaciones, categoriaActual, filtroRapido, busqueda, destacados]);

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto text-on-surface space-y-4">
      
      {/* ─── BARRA DE BÚSQUEDA SUPERIOR ESTILO GMAIL ──────────────────────────── */}
      <div className="bg-surface border border-outline-variant/80 rounded-2xl p-2.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* BUSCADOR */}
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-on-surface-variant/70" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en mensajes, habitaciones, remitente..."
            className="w-full pl-10 pr-9 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ACCIONES GLOBALES */}
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          {conteos.noLeidos > 0 && (
            <button
              onClick={() => {
                notificaciones.forEach(n => !n.leido && marcarComoLeida(n.id));
                AlertAdapter.toast('Todos los mensajes marcados como leídos', 'success');
              }}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl border border-primary/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Marcar todo leído</span>
            </button>
          )}

          {notificaciones.length > 0 && (
            <button
              onClick={limpiarTodas}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Vaciar todos los mensajes de la bandeja"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Vaciar bandeja</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── CONTENEDOR PRINCIPAL: PANEL LATERAL DE CARPETAS + BANDEJA DE CORREO ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* PANEL LATERAL IZQUIERDO: CARPETAS Y FILTROS ESTILO GMAIL */}
        <div className="lg:col-span-3 bg-surface border border-outline-variant/80 rounded-2xl p-3 shadow-sm space-y-1 select-none">
          
          <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
            <span>Carpetas</span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>

          {[
            { id: 'recibidos', label: 'Todos los Recibidos', icon: <Inbox className="h-4 w-4" />, count: conteos.total, badgeColor: 'bg-primary text-on-primary' },
            { id: 'no-leidos', label: 'No Leídos', icon: <Mail className="h-4 w-4" />, count: conteos.noLeidos, badgeColor: 'bg-error text-white' },
            { id: 'destacados', label: 'Destacados', icon: <Star className="h-4 w-4 text-amber-500 fill-amber-500" />, count: conteos.dest, badgeColor: 'bg-amber-500 text-white' },
            { id: 'habitaciones', label: 'Habitaciones y Limpieza', icon: <DoorOpen className="h-4 w-4 text-amber-600" />, count: conteos.habs, badgeColor: 'bg-amber-600/20 text-amber-800 dark:text-amber-200' },
            { id: 'caja', label: 'Caja y Egresos', icon: <DollarSign className="h-4 w-4 text-emerald-600" />, count: conteos.caja, badgeColor: 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-200' },
            { id: 'auditoria', label: 'Auditoría y Turnos', icon: <Shield className="h-4 w-4 text-sky-600" />, count: conteos.audit, badgeColor: 'bg-sky-600/20 text-sky-800 dark:text-sky-200' },
            { id: 'todos', label: 'Historial Completo', icon: <MailOpen className="h-4 w-4 text-on-surface-variant" />, count: conteos.total, badgeColor: 'bg-surface-container text-on-surface-variant' },
          ].map((item) => {
            const isActive = categoriaActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCategoriaActual(item.id as CategoriaBandeja);
                  setSeleccionados(new Set());
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    isActive ? item.badgeColor : 'bg-surface-container-high text-on-surface-variant font-bold'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-outline-variant/60 px-3">
            <p className="text-[10px] text-on-surface-variant/70 leading-normal">
              💡 <b>Tip</b>: Haz clic en cualquier mensaje para desglosar y ver el detalle completo o ejecutar acciones.
            </p>
          </div>
        </div>

        {/* PANEL PRINCIPAL: LISTA DE MENSAJES ESTILO GMAIL CON DESGLOSE ACORDEÓN */}
        <div className="lg:col-span-9 bg-surface border border-outline-variant/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* BARRA DE HERRAMIENTAS DE LA LISTA */}
          <div className="p-3 bg-surface-container-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* HERRAMIENTAS DE SELECCIÓN Y ACCIONES EN LOTE */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={listaFiltrada.length > 0 && seleccionados.size === listaFiltrada.length}
                  onChange={handleToggleSeleccionarTodos}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-on-surface-variant">Seleccionar todo</span>
              </label>

              {seleccionados.size > 0 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-outline-variant">
                  <button
                    onClick={handleMarcarSeleccionadosLeidos}
                    className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors cursor-pointer"
                    title="Marcar como leídos"
                  >
                    <MailOpen className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleMarcarSeleccionadosNoLeidos}
                    className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors cursor-pointer"
                    title="Marcar como no leídos"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleEliminarSeleccionados}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors cursor-pointer"
                    title="Eliminar seleccionados"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-bold text-primary px-1.5">
                    ({seleccionados.size} seleccionados)
                  </span>
                </div>
              )}
            </div>

            {/* FILTROS RÁPIDOS / CHIPS */}
            <div className="flex items-center gap-1.5">
              {(['todos', 'no-leidos', 'acciones'] as const).map((fr) => (
                <button
                  key={fr}
                  onClick={() => setFiltroRapido(fr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    filtroRapido === fr
                      ? 'bg-primary text-on-primary shadow-2xs'
                      : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60'
                  }`}
                >
                  {fr === 'todos' && 'Todos'}
                  {fr === 'no-leidos' && 'No leídos'}
                  {fr === 'acciones' && '🔑 Por Liberar'}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE CORREOS */}
          {listaFiltrada.length === 0 ? (
            <div className="py-20 px-6 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-surface-container-low rounded-2xl text-on-surface-variant/40">
                <Inbox className="h-12 w-12" />
              </div>
              <h4 className="text-sm font-bold text-on-surface">No hay mensajes en esta categoría</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'Tu bandeja de mensajes está completamente al día.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/60">
              {listaFiltrada.map((item) => {
                const isExpanded = expandidos.has(item.id);
                const isSelected = seleccionados.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`transition-all ${
                      item.leido
                        ? 'bg-surface hover:bg-surface-container-low/60'
                        : 'bg-primary/5 hover:bg-primary/10 font-bold'
                    } ${isExpanded ? 'bg-surface-container-low/90 shadow-2xs ring-1 ring-primary/20' : ''}`}
                  >
                    {/* ─── FILA PRINCIPAL ESTILO GMAIL ─────────────────────── */}
                    <div
                      onClick={() => toggleExpandir(item.id, item.leido)}
                      className="px-3.5 py-3 flex items-center gap-3 cursor-pointer select-none"
                    >
                      {/* 1. CHECKBOX */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => toggleSeleccion(item.id, e)}
                        onChange={() => {}}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer shrink-0"
                      />

                      {/* 2. ESTRELLA DE DESTACADO */}
                      <button
                        onClick={(e) => toggleDestacado(item.id, e)}
                        className="text-on-surface-variant/40 hover:text-amber-500 p-0.5 transition-colors cursor-pointer shrink-0"
                        title={item.esDestacado ? 'Quitar de destacados' : 'Destacar mensaje'}
                      >
                        <Star className={`h-4 w-4 ${item.esDestacado ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>

                      {/* 3. REMITENTE / BADGE */}
                      <div className="w-28 sm:w-36 shrink-0 truncate flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider border truncate ${item.badgeColor}`}>
                          {item.habitacionNumero}
                        </span>
                      </div>

                      {/* 4. ASUNTO + PREVIEW DEL TEXTO EN 1 LÍNEA */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className={`text-xs truncate ${!item.leido ? 'text-on-surface font-black' : 'text-on-surface font-semibold'}`}>
                          {item.asunto}
                        </span>
                        <span className="text-xs text-on-surface-variant/70 truncate hidden sm:inline font-normal">
                          — {item.mensaje}
                        </span>
                      </div>

                      {/* 5. HORA / FECHA & BOTÓN EXPANDIR */}
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="text-[11px] font-semibold text-on-surface-variant whitespace-nowrap">
                          {formatHoraGmail(item.timestamp)}
                        </span>
                        <div className="text-on-surface-variant/60 p-0.5">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* ─── DESGLOSE HACIA ABAJO (DETALLE DEL CORREO) ──────────── */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-outline-variant/40 space-y-4 bg-surface-lowest/70 animate-in fade-in-50 duration-200">
                        
                        {/* CABECERA DEL CORREO */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm shrink-0">
                              {item.iconoRemitente}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-on-surface">{item.remitente}</h4>
                                <span className="text-[10px] text-on-surface-variant font-medium">
                                  &lt;sistema.interno@hospedaje.com&gt;
                                </span>
                              </div>
                              <p className="text-[10.5px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>{formatHoraCompleta(item.timestamp)}</span>
                              </p>
                            </div>
                          </div>

                          {/* ACCIONES RÁPIDAS DEL CORREO */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => marcarComoNoLeida(item.id)}
                              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Marcar como no leído"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span>Marcar no leído</span>
                            </button>

                            <button
                              onClick={() => {
                                eliminarNotificacion(item.id);
                                AlertAdapter.toast('Mensaje eliminado', 'info');
                              }}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Eliminar este mensaje"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>

                        {/* CUERPO DEL CORREO */}
                        <div className="p-4 bg-surface border border-outline-variant/60 rounded-xl space-y-2">
                          <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                            {item.mensaje}
                          </p>
                        </div>

                        {/* ACCIONES OPERATIVAS SEGÚN EL TIPO DE ALERTA */}
                        {(usuario?.rol === 'admin' || usuario?.rol === 'supervisor') && item.esHabitacion && (
                          <div className="p-3.5 bg-surface border-2 border-primary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                                <DoorOpen className="h-5 w-5" />
                              </div>
                              <div className="text-xs">
                                <p className="font-black text-on-surface">
                                  Acción requerida: <span className="text-primary font-bold">Habitación N° {item.numHab || item.habitacionNumero}</span>
                                </p>
                                <p className="text-[11px] text-on-surface-variant mt-0.5">
                                  Requiere confirmación de limpieza para quedar disponible en el sistema.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleLiberarHabitacion(item.numHab || item.habitacionNumero, item.id, e)}
                              disabled={liberandoHab === (item.numHab || item.habitacionNumero)}
                              className="px-4 py-2.5 bg-primary hover:opacity-90 active:scale-95 text-on-primary font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {liberandoHab === (item.numHab || item.habitacionNumero) ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Liberando...</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound className="h-4 w-4" />
                                  <span>Liberar Habitación {item.numHab || item.habitacionNumero}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

