import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { HabitacionesRepository } from '../../data/repositories/habitaciones.repository';
import { AlertAdapter } from '../../core/adapters/alert.adapter';
import { EnviarNotificacionModal } from '../components/shared/EnviarNotificacionModal';
import {
  Inbox,
  Star,
  Trash2,
  Search,
  Loader2,
  Mail,
  MailOpen,
  DoorOpen,
  DollarSign,
  RefreshCw,
  Plus,
  Check,
  CheckCircle2,
  Copy,
  Headphones,
  Brush,
  Layers
} from 'lucide-react';

const habitacionesRepo = new HabitacionesRepository();

type FiltroBandeja = 'todas' | 'no_leidas' | 'destacadas' | 'habitaciones' | 'consultas' | 'limpieza' | 'caja';

export const BandejaNotificaciones: React.FC = () => {
  const { notificaciones, marcarComoLeida, marcarComoNoLeida, eliminarNotificacion, limpiarTodas } = useNotifications();

  // Estados de interfaz
  const [filtroActivo, setFiltroActivo] = useState<FiltroBandeja>('todas');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false);
  const [liberandoHab, setLiberandoHab] = useState<string | null>(null);

  // Mensajes destacados persistidos en localStorage
  const [destacados, setDestacados] = useState<Set<string>>(() => {
    try {
      const guardados = localStorage.getItem('notificaciones_destacadas');
      return guardados ? new Set(JSON.parse(guardados)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('notificaciones_destacadas', JSON.stringify(Array.from(destacados)));
    } catch (e) {
      console.error('Error al guardar destacados:', e);
    }
  }, [destacados]);

  // Toggle destacar
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

  // Parser inteligente de notificación para extraer campos enriquecidos
  const parsearNotificacion = (n: any) => {
    let remitenteNombre = 'ALFRED NICK RAMIREZ SIAS';
    let remitenteRol = 'RECEPCIONISTA';
    let titulo = '';
    let cuerpo = n.mensaje || '';
    let tipoEvento = 'alerta';
    let habitacion = '';
    let estanciaId = 'No aplica';
    let dirigidoA = 'TODOS';

    // 1. Extraer habitación
    if (n.habitacionNumero) {
      const matchNum = n.habitacionNumero.match(/\d+/);
      if (matchNum) {
        habitacion = matchNum[0];
      }
    }

    // 2. Extraer remitente
    const matchRem = n.mensaje?.match(/\(De:\s*([^)]+)\)/i);
    if (matchRem) {
      remitenteNombre = matchRem[1].trim();
    } else if (n.mensaje?.toLowerCase().includes('recepción (')) {
      const matchRec = n.mensaje.match(/recepción \(([^)]+)\)/i);
      if (matchRec) remitenteNombre = matchRec[1].trim();
    } else if (n.mensaje?.toLowerCase().includes('solicita egreso')) {
      const matchEgreso = n.mensaje.match(/💸\s*([^\s]+)/i);
      if (matchEgreso) remitenteNombre = matchEgreso[1].trim();
    }

    // 3. Extraer título y cuerpo
    if (n.mensaje?.includes('—')) {
      const partes = n.mensaje.split('—');
      titulo = partes[0].replace(/\(De:[^)]+\)/gi, '').trim();
      cuerpo = partes.slice(1).join('—').trim();
    } else if (n.mensaje?.startsWith('🔔') || n.mensaje?.startsWith('🚨') || n.mensaje?.startsWith('💸')) {
      const firstColon = n.mensaje.indexOf(':');
      if (firstColon > -1) {
        titulo = n.mensaje.substring(0, firstColon).trim();
        cuerpo = n.mensaje.substring(firstColon + 1).trim();
      } else {
        titulo = n.mensaje;
      }
    } else {
      titulo = habitacion ? `Consulta de atención – Hab. ${habitacion}` : 'Notificación de Operaciones';
    }

    if (!titulo) {
      titulo = habitacion ? `Consulta de atención – Hab. ${habitacion}` : 'Notificación de Operaciones';
    }

    // Limpiar emojis repetidos si el título ya los tiene
    titulo = titulo.replace(/^🔔\s*/, '').trim();

    // 4. Determinar tipo / categoría
    const textoCompleto = `${titulo} ${cuerpo} ${n.habitacionNumero || ''}`.toLowerCase();
    if (textoCompleto.includes('limpieza') || textoCompleto.includes('liberar') || textoCompleto.includes('liberación')) {
      tipoEvento = 'limpieza';
    } else if (textoCompleto.includes('consulta') || textoCompleto.includes('atención')) {
      tipoEvento = 'consulta';
    } else if (textoCompleto.includes('egreso') || textoCompleto.includes('caja') || n.habitacionNumero === 'EGRESO' || n.habitacionNumero === 'CAJA') {
      tipoEvento = 'caja';
    }

    const esDestacado = destacados.has(n.id);

    return {
      ...n,
      remitenteNombre,
      remitenteRol,
      titulo,
      cuerpo,
      tipoEvento,
      habitacion,
      estanciaId,
      dirigidoA,
      esDestacado
    };
  };

  // Lista procesada
  const notificacionesProcesadas = useMemo(() => {
    return notificaciones.map(parsearNotificacion);
  }, [notificaciones, destacados]);

  // Conteos para las pastillas de filtro
  const conteos = useMemo(() => {
    return {
      todas: notificacionesProcesadas.length,
      no_leidas: notificacionesProcesadas.filter(n => !n.leido).length,
      destacadas: notificacionesProcesadas.filter(n => n.esDestacado).length,
      habitaciones: notificacionesProcesadas.filter(n => Boolean(n.habitacion)).length,
      consultas: notificacionesProcesadas.filter(n => n.tipoEvento === 'consulta').length,
      limpieza: notificacionesProcesadas.filter(n => n.tipoEvento === 'limpieza').length,
      caja: notificacionesProcesadas.filter(n => n.tipoEvento === 'caja').length,
    };
  }, [notificacionesProcesadas]);

  // Lista filtrada
  const listaFiltrada = useMemo(() => {
    return notificacionesProcesadas.filter(item => {
      // 1. Filtro por tipo de pastilla
      if (filtroActivo === 'no_leidas' && item.leido) return false;
      if (filtroActivo === 'destacadas' && !item.esDestacado) return false;
      if (filtroActivo === 'habitaciones' && !item.habitacion) return false;
      if (filtroActivo === 'consultas' && item.tipoEvento !== 'consulta') return false;
      if (filtroActivo === 'limpieza' && item.tipoEvento !== 'limpieza') return false;
      if (filtroActivo === 'caja' && item.tipoEvento !== 'caja') return false;

      // 2. Búsqueda por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          item.remitenteNombre.toLowerCase().includes(q) ||
          item.remitenteRol.toLowerCase().includes(q) ||
          item.titulo.toLowerCase().includes(q) ||
          item.cuerpo.toLowerCase().includes(q) ||
          (item.habitacion && item.habitacion.toLowerCase().includes(q));
        if (!coincide) return false;
      }

      return true;
    });
  }, [notificacionesProcesadas, filtroActivo, busqueda]);

  // Mantener seleccionado un elemento válido
  useEffect(() => {
    if (listaFiltrada.length > 0) {
      if (!selectedId || !listaFiltrada.some(n => n.id === selectedId)) {
        setSelectedId(listaFiltrada[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [listaFiltrada, selectedId]);

  // Mensaje seleccionado actualmente
  const selectedItem = useMemo(() => {
    return notificacionesProcesadas.find(n => n.id === selectedId) || null;
  }, [notificacionesProcesadas, selectedId]);

  // Seleccionar notificación y marcarla leída
  const handleSelectNotificacion = (item: any) => {
    setSelectedId(item.id);
    if (!item.leido) {
      marcarComoLeida(item.id);
    }
  };

  // Liberar habitación
  const handleLiberarHabitacion = async (numeroHab: string, alertaId: string) => {
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

  // Copiar ID
  const handleCopiarId = (id: string) => {
    navigator.clipboard.writeText(id);
    AlertAdapter.toast('ID de notificación copiado', 'info');
  };

  // Formato de fecha para tarjetas de la lista izquierda
  const formatCardDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const diaNom = dias[d.getDay()];
      const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${diaNom}, ${hora}`;
    } catch {
      return dateStr;
    }
  };

  // Formato de fecha para el detalle derecho
  const formatDetailDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const fecha = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      return { fecha, hora };
    } catch {
      return { fecha: dateStr, hora: '' };
    }
  };

  return (
    <div className="w-full text-on-surface space-y-4">
      
      {/* ─── 1. HEADER CARD SUPERIOR ───────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LADO IZQUIERDO: ÍCONO + TÍTULO + BADGE EN VIVO + SUBTÍTULO */}
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#006b4d] text-white flex items-center justify-center shadow-xs shrink-0">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">
                Bandeja de Mensajes y Alertas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>En vivo</span>
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Registro de eventos, avisos de recepción y notificaciones en tiempo real.
            </p>
          </div>
        </div>

        {/* LADO DERECHO: BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalNuevaOpen(true)}
            className="px-4 py-2 bg-primary hover:opacity-90 active:scale-95 text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Notificación</span>
          </button>

          <button
            onClick={() => {
              notificaciones.forEach(n => !n.leido && marcarComoLeida(n.id));
              AlertAdapter.toast('Todos los mensajes marcados como leídos', 'success');
            }}
            className="px-3.5 py-2 border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Marcar todo leído</span>
          </button>

          <button
            onClick={() => AlertAdapter.toast('Bandeja sincronizada en tiempo real', 'success')}
            className="p-2 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            title="Sincronizar bandeja"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {notificaciones.length > 0 && (
            <button
              onClick={limpiarTodas}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 transition-colors cursor-pointer"
              title="Vaciar todos los mensajes de la bandeja"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. BUSCADOR Y PASTILLAS DE FILTRO (CHIPS) ────────────────────── */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 shadow-xs space-y-3">
        
        {/* BUSCADOR */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por remitente, rol, título, mensaje o habitación..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low/70 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* PASTILLAS DE FILTRO */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none scrollbar-none">
          {[
            { id: 'todas', label: 'Todas', count: conteos.todas, icon: null },
            { id: 'no_leidas', label: 'No Leídas', count: conteos.no_leidas, icon: <Mail className="h-3.5 w-3.5" /> },
            { id: 'destacadas', label: 'Destacadas', count: conteos.destacadas, icon: <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> },
            { id: 'habitaciones', label: 'Habitaciones', count: conteos.habitaciones, icon: <Layers className="h-3.5 w-3.5" /> },
            { id: 'consultas', label: 'Consultas', count: conteos.consultas, icon: <Headphones className="h-3.5 w-3.5" /> },
            { id: 'limpieza', label: 'Limpieza / Liberación', count: conteos.limpieza, icon: <Brush className="h-3.5 w-3.5" /> },
            { id: 'caja', label: 'Caja / Egresos', count: conteos.caja, icon: <DollarSign className="h-3.5 w-3.5" /> },
          ].map((chip) => {
            const isActive = filtroActivo === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFiltroActivo(chip.id as FiltroBandeja)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-[#006b4d] text-white border-[#006b4d] shadow-2xs'
                    : 'bg-surface-container-low/60 hover:bg-surface-container border-outline-variant/60 text-on-surface-variant'
                }`}
              >
                {chip.icon}
                <span>{chip.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. SPLIT PANE: BANDEJA DE ENTRADA (IZQUIERDA) + DETALLE (DERECHA) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-start">
        
        {/* COLUMNA IZQUIERDA: LISTA DE MENSAJES (5 de 12 columnas) */}
        <div className="lg:col-span-5 bg-surface border border-outline-variant/60 rounded-2xl p-4 shadow-xs space-y-3">
          
          {/* CABECERA DE LA LISTA */}
          <div className="flex items-center justify-between text-xs pb-1 border-b border-outline-variant/40">
            <h3 className="font-bold text-on-surface">
              Bandeja de Entrada ({listaFiltrada.length})
            </h3>
            <span className="text-[11px] font-medium text-on-surface-variant">
              Orden: Más recientes
            </span>
          </div>

          {/* LISTA DE NOTIFICACIONES */}
          {listaFiltrada.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5 text-on-surface-variant">
              <div className="h-12 w-12 rounded-full bg-surface-container-low flex items-center justify-center">
                <Inbox className="h-6 w-6 text-on-surface-variant/40" />
              </div>
              <p className="text-xs font-bold">No hay notificaciones en este filtro</p>
              <p className="text-[11px] text-on-surface-variant/70">
                {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'Tu bandeja está completamente al día.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {listaFiltrada.map((item) => {
                const isSelected = item.id === selectedId;
                const initial = item.remitenteNombre?.charAt(0).toUpperCase() || 'A';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectNotificacion(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/5 shadow-2xs'
                        : 'border-outline-variant/60 bg-surface hover:bg-surface-container-low/70'
                    }`}
                  >
                    {/* FILA 1: PUNTO NO LEÍDO + AVATAR + NOMBRE + ROL + HORA + ESTRELLA */}
                    <div className="flex items-center gap-2">
                      {!item.leido && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      )}

                      {/* Avatar circular */}
                      <div className="h-6 w-6 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initial}
                      </div>

                      {/* Nombre del remitente */}
                      <span className="text-xs font-black text-on-surface truncate">
                        {item.remitenteNombre}
                      </span>

                      {/* Badge de Rol */}
                      <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[9px] uppercase tracking-wider shrink-0">
                        {item.remitenteRol}
                      </span>

                      <div className="flex-1" />

                      {/* Hora */}
                      <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                        {formatCardDate(item.timestamp)}
                      </span>

                      {/* Estrella */}
                      <button
                        onClick={(e) => toggleDestacado(item.id, e)}
                        className="text-on-surface-variant/40 hover:text-amber-500 p-0.5 transition-colors cursor-pointer shrink-0"
                        title={item.esDestacado ? 'Quitar de destacados' : 'Destacar'}
                      >
                        <Star className={`h-3.5 w-3.5 ${item.esDestacado ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* FILA 2: PASTILLAS DE CATEGORÍA & HABITACIÓN */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/50 flex items-center gap-1">
                        <Headphones className="h-3 w-3" />
                        <span>Consulta</span>
                      </span>

                      {item.habitacion && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                          <DoorOpen className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                          <span>Hab. {item.habitacion}</span>
                        </span>
                      )}
                    </div>

                    {/* FILA 3: TÍTULO CON CAMPANA */}
                    <h4 className="text-xs font-bold text-on-surface mt-2 flex items-center gap-1.5 line-clamp-1">
                      <span className="text-amber-500">🔔</span>
                      <span>{item.titulo}</span>
                    </h4>

                    {/* FILA 4: PREVIEW DEL MENSAJE */}
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed mt-1">
                      {item.cuerpo}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: DETALLE DEL MENSAJE (7 de 12 columnas) */}
        <div className="lg:col-span-7 bg-surface border border-outline-variant/60 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 sticky top-24">
          
          {selectedItem ? (
            <>
              {/* BARRA SUPERIOR DE ACCIONES: ESTADO LEÍDO + BOTONES */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/50">
                {/* ESTADO CHIP */}
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  selectedItem.leido
                    ? 'bg-surface-container text-on-surface-variant border-outline-variant/60'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}>
                  {selectedItem.leido ? <MailOpen className="h-3.5 w-3.5 text-primary" /> : <Mail className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>{selectedItem.leido ? 'Leído' : 'No Leído'}</span>
                </span>

                {/* ACCIONES */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (selectedItem.leido) {
                        marcarComoNoLeida(selectedItem.id);
                      } else {
                        marcarComoLeida(selectedItem.id);
                      }
                    }}
                    className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors cursor-pointer"
                    title={selectedItem.leido ? 'Marcar como no leído' : 'Marcar como leído'}
                  >
                    <Mail className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => toggleDestacado(selectedItem.id, e)}
                    className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors cursor-pointer"
                    title={selectedItem.esDestacado ? 'Quitar de destacados' : 'Destacar'}
                  >
                    <Star className={`h-4 w-4 ${selectedItem.esDestacado ? 'text-amber-500 fill-amber-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleCopiarId(selectedItem.id)}
                    className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors cursor-pointer"
                    title="Copiar ID de Notificación"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      eliminarNotificacion(selectedItem.id);
                      AlertAdapter.toast('Notificación eliminada', 'info');
                    }}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 transition-colors cursor-pointer"
                    title="Eliminar notificación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* REMITENTE Y METADATA */}
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-base flex items-center justify-center shrink-0">
                  {selectedItem.remitenteNombre?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-on-surface">
                      {selectedItem.remitenteNombre}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[9.5px] uppercase tracking-wider">
                      {selectedItem.remitenteRol}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                    Dirigido a: {selectedItem.dirigidoA} • Fecha: {formatDetailDate(selectedItem.timestamp).fecha} • {formatDetailDate(selectedItem.timestamp).hora}
                  </p>
                </div>
              </div>

              {/* BENTO GRID DE METADATA (4 COLUMNAS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Tipo de Evento
                  </span>
                  <p className="font-bold text-on-surface mt-0.5 capitalize">
                    {selectedItem.tipoEvento}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Habitación
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">
                    {selectedItem.habitacion || 'No aplica'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Estancia ID
                  </span>
                  <p className="font-bold text-on-surface mt-0.5">
                    {selectedItem.estanciaId || 'No aplica'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    ID Notificación
                  </span>
                  <p className="font-mono text-on-surface-variant mt-0.5 truncate" title={selectedItem.id}>
                    {selectedItem.id.substring(0, 8)}...
                  </p>
                </div>
              </div>

              {/* TÍTULO PRINCIPAL */}
              <div className="pt-1">
                <h3 className="text-base sm:text-lg font-black text-on-surface flex items-center gap-2">
                  <span className="text-amber-500">🔔</span>
                  <span>{selectedItem.titulo}</span>
                </h3>
              </div>

              {/* CUERPO DEL MENSAJE */}
              <div className="p-4 bg-surface-container-low/70 border border-outline-variant/50 rounded-xl">
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedItem.cuerpo}
                </p>
              </div>

              {/* BANNER DE ACCIÓN: OPERACIÓN DE HABITACIÓN */}
              {selectedItem.habitacion && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4.5 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-2xs">
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-on-surface">
                        Operación de Habitación N° {selectedItem.habitacion}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        Si la habitación ya se encuentra limpia y disponible para nuevos huéspedes, puedes liberarla directamente.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLiberarHabitacion(selectedItem.habitacion, selectedItem.id)}
                    disabled={liberandoHab === selectedItem.habitacion}
                    className="w-full py-2.5 bg-primary hover:opacity-90 active:scale-[0.99] text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {liberandoHab === selectedItem.habitacion ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Liberando Habitación N° {selectedItem.habitacion}...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Liberar Habitación N° {selectedItem.habitacion}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <div className="h-14 w-14 rounded-full bg-surface-container-low flex items-center justify-center">
                <Inbox className="h-7 w-7 text-on-surface-variant/40" />
              </div>
              <h4 className="text-sm font-bold text-on-surface">Selecciona una notificación</h4>
              <p className="text-xs text-on-surface-variant/70 max-w-xs">
                Haz clic en cualquier mensaje de la lista de la izquierda para ver su contenido y opciones de gestión.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ─── MODAL NUEVA NOTIFICACIÓN ─────────────────────────────────────── */}
      <EnviarNotificacionModal
        isOpen={isModalNuevaOpen}
        onClose={() => setIsModalNuevaOpen(false)}
      />

    </div>
  );
};
