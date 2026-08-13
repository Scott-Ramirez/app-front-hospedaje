import React, { useState, useEffect } from 'react';
import { useHabitaciones } from '../hooks/useHabitaciones';
import { useAuth } from '../context/AuthContext';

import {
    Search,
    Plus,
    CheckCircle,
    DoorOpen,
    Brush,
    Building,
    Edit3,
    Trash2,
    X,
    Wifi,
    Snowflake,
    Wind,
    Loader2,
    Check,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Bell
} from 'lucide-react';
import { EnviarNotificacionModal } from '../components/shared/EnviarNotificacionModal';

export const HabitacionesCRUD: React.FC = () => {
    const {
        cargando,
        busqueda,
        setBusqueda,
        modalAbierto,
        setModalAbierto,
        editandoId,
        form,
        setForm,
        metrics,
        habitacionesFiltradas,
        handleNuevoClick,
        handleEditarClick,
        handleGuardar,
        handleEliminar,
        handleLiberar
    } = useHabitaciones();

    // 🌟 EXTRAEMOS EL USUARIO PARA CORRER LAS VALIDACIONES DE ROL
    const { usuario } = useAuth();
    const [notificarHabitacion, setNotificarHabitacion] = useState<string | null>(null);

    // 🌟 VALIDACIÓN DE ACCESOS CRÍTICOS
    const esAdminOSupervisor = usuario?.rol === 'admin' || usuario?.rol === 'supervisor';
    const esAdmin = usuario?.rol === 'admin';
    const esRecepcionista = usuario?.rol === 'recepcionista';

    // 🌟 ESTADOS PARA PAGINACIÓN (5 en 5)
    const [paginaActual, setPaginaActual] = useState<number>(1);
    const itemsPorPagina = 5;

    // Resetea la página a la 1 cuando el usuario escribe en el buscador para evitar desbordes
    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    if (cargando) {
        return (
            <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
                <div className="relative flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="absolute h-2 w-2 bg-primary rounded-full" />
                </div>
                <p className="text-sm font-medium text-on-surface-variant animate-pulse">
                    Sincronizando inventario de habitaciones...
                </p>
            </div>
        );
    }



    // 🌟 CÁLCULO DE PAGINACIÓN DINÁMICA
    const totalItems = habitacionesFiltradas.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
    const indiceInicial = (paginaActual - 1) * itemsPorPagina;
    const indiceFinal = indiceInicial + itemsPorPagina;
    const habitacionesPaginadas = habitacionesFiltradas.slice(indiceInicial, indiceFinal);

    return (
        <div className="p-6 max-w-[1280px] mx-auto text-on-surface">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Inventario de Habitaciones</h2>
                    <p className="text-sm text-on-surface-variant">Control operativo e infraestructura en tiempo real.</p>
                </div>

                {/* BUSCADOR Y ACCIONES */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar habitación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-on-surface"
                        />
                    </div>
                    
                    {/* 🌟 CONDICIONAL: Ocultamos el botón "Nueva Habitación" si no es administrador */}
                    {esAdmin && (
                        <button
                            onClick={handleNuevoClick}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Nueva Habitación
                        </button>
                    )}
                </div>
            </div>

            {/* INDICADORES BENTO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-green-500/10 text-green-600 rounded-lg w-fit">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Disponibles</p>
                        <h3 className="text-3xl font-bold">{metrics.disponibles}</h3>
                    </div>
                </div>

                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg w-fit">
                        <DoorOpen className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Ocupadas</p>
                        <h3 className="text-3xl font-bold">{metrics.ocupadas}</h3>
                    </div>
                </div>

                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg w-fit">
                        <Brush className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Limpieza</p>
                        <h3 className="text-3xl font-bold">{metrics.limpieza}</h3>
                    </div>
                </div>

                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg w-fit">
                        <Building className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Total Unidades</p>
                        <h3 className="text-3xl font-bold">{metrics.total}</h3>
                    </div>
                </div>
            </div>

            {/* TABLA PROFESIONAL DE INVENTARIO */}
            <div className="bg-surface-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-bold text-on-surface-variant uppercase tracking-wider select-none">
                                <th className="py-4 px-5">Nº Cuarto</th>
                                <th className="py-4 px-5">Tipo de Unidad</th>
                                <th className="py-4 px-5">Infraestructura</th>
                                <th className="py-4 px-5">Precio Base</th>
                                <th className="py-4 px-5">Estado Operativo</th>
                                <th className="py-4 px-5 text-center">Acciones de Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40 text-sm font-medium">
                            {habitacionesPaginadas.length === 0 ? (
                                <tr>
                                    <td colSpan={esRecepcionista ? 5 : 6} className="text-center py-12 text-on-surface-variant/80">
                                        Ninguna unidad física coincide con los criterios de búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                habitacionesPaginadas.map((room) => (
                                    <tr key={room.id} className="hover:bg-surface-container-lowest transition-colors group">
                                        <td className="py-3.5 px-5 font-bold text-on-surface">
                                            Habitación {room.numero}
                                        </td>
                                        <td className="py-3.5 px-5 capitalize text-on-surface-variant">
                                            {room.tipo}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <div className="flex gap-2.5 text-on-surface-variant/30">
                                                {room.wifi && (
                                                    <span title="Wifi Incluido"><Wifi className="h-4 w-4 text-primary" /></span>
                                                )}
                                                {room.aire_acondicionado && (
                                                    <span title="Aire Acondicionado"><Snowflake className="h-4 w-4 text-blue-500" /></span>
                                                )}
                                                {room.ventilador && (
                                                    <span title="Ventilador"><Wind className="h-4 w-4 text-amber-500" /></span>
                                                )}
                                                {!room.wifi && !room.aire_acondicionado && !room.ventilador && (
                                                    <span className="text-xs italic text-on-surface-variant/50">Servicios estándar</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 font-semibold text-primary">
                                            S/. {room.precio?.toFixed(2)}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                                room.estado === 'disponible' 
                                                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                                    : room.estado === 'ocupado' 
                                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    room.estado === 'disponible' ? 'bg-green-500' : room.estado === 'ocupado' ? 'bg-blue-500' : 'bg-amber-500'
                                                }`} />
                                                {room.estado}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                
                                                {/* 🌟 1. BOTÓN NOTIFICAR: Únicamente en filas de Habitación en LIMPIEZA */}
                                                {room.estado === 'limpieza' && (
                                                    <button
                                                        onClick={() => setNotificarHabitacion(room.numero)}
                                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                                        title="Notificar a Admin/Supervisor sobre esta habitación en limpieza"
                                                    >
                                                        <Bell className="h-3.5 w-3.5" /> Notificar
                                                    </button>
                                                )}

                                                {/* 🌟 2. BOTÓN LIBERAR: Exclusivo para Administrador y Supervisor cuando está en Limpieza */}
                                                {room.estado === 'limpieza' && esAdminOSupervisor && (
                                                    <button
                                                        onClick={() => handleLiberar(room.id!, room.numero)}
                                                        className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                                        title="Liberar habitación y colocar en disponible"
                                                    >
                                                        <Check className="h-3.5 w-3.5" /> Liberar
                                                    </button>
                                                )}

                                                {/* 🌟 3. ACCIÓN MODIFICAR: Habilitada para Admin/Supervisor, Deshabilitada para Recepcionista */}
                                                {room.estado !== 'limpieza' && (
                                                    <button
                                                        onClick={() => esAdminOSupervisor && handleEditarClick(room)}
                                                        disabled={!esAdminOSupervisor}
                                                        className={`p-1.5 rounded-md transition-colors ${
                                                            esAdminOSupervisor 
                                                                ? 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface cursor-pointer' 
                                                                : 'bg-surface-container/60 text-on-surface-variant/40 border border-outline-variant/30 cursor-not-allowed'
                                                        }`}
                                                        title={esAdminOSupervisor ? "Modificar parámetros de la habitación" : "Edición deshabilitada para recepcionista"}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                {/* 🌟 4. ACCIÓN ELIMINAR: Exclusiva para Admin */}
                                                {esAdmin && (
                                                    <button
                                                        onClick={() => handleEliminar(room.id!)}
                                                        className="p-1.5 border border-error/20 hover:bg-error/5 text-error rounded-md transition-colors cursor-pointer"
                                                        title="Eliminar habitación de la base de datos"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* CONTROLES DE PAGINACIÓN */}
                <div className="bg-surface-container-low px-5 py-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                    <p className="text-xs font-semibold text-on-surface-variant">
                        Mostrando registros del <span className="text-on-surface">{totalItems === 0 ? 0 : indiceInicial + 1}</span> al <span className="text-on-surface">{Math.min(indiceFinal, totalItems)}</span> de un total de <span className="text-on-surface">{totalItems}</span> unidades.
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                            disabled={paginaActual === 1}
                            className="p-1.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-lowest transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="text-xs font-bold px-3 text-on-surface-variant">
                            Página <span className="text-on-surface">{paginaActual}</span> de {totalPaginas}
                        </div>

                        <button
                            onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                            className="p-1.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-lowest transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* MODAL FORMULARIO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden text-on-surface">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-lg font-bold">
                                {editandoId ? 'Modificar Habitación' : 'Añadir Nueva Habitación'}
                            </h3>
                            <button onClick={() => setModalAbierto(false)} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* 🌟 BLINDAJE EXTRA: Si por error un recepcionista altera el estado y ve el modal, se le avisa que no puede guardar */}
                        {!esAdminOSupervisor ? (
                            <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <ShieldAlert className="h-12 w-12 text-amber-500" />
                                <h4 className="text-base font-bold">Operación Denegada</h4>
                                <p className="text-sm text-on-surface-variant">Tu nivel de acceso como Recepcionista no te permite alterar la infraestructura ni los precios del hotel.</p>
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold">Cerrar Ventana</button>
                            </div>
                        ) : (
                            <form onSubmit={handleGuardar}>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Número Comercial</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.numero}
                                            onChange={(e) => setForm({ ...form, numero: e.target.value })}
                                            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                            placeholder="Ej. 104"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Tipo de Habitación</label>
                                        <select
                                            value={form.tipo}
                                            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                                            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                        >
                                            <option value="simple" className="bg-surface text-on-surface">Simple</option>
                                            <option value="matrimonial" className="bg-surface text-on-surface">Matrimonial</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Precio Base por Noche (S/.)</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={form.precio === 0 ? '' : form.precio}
                                            onChange={(e) => setForm({ ...form, precio: e.target.value === '' ? 0 : Number(e.target.value) })}
                                            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                        />
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <label className="block text-xs font-bold text-on-surface-variant uppercase">Características e Infraestructura</label>
                                        <div className="grid grid-cols-2 gap-2 pt-1 text-on-surface">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.wifi} 
                                                    onChange={(e) => setForm({ ...form, wifi: e.target.checked })} 
                                                    className="rounded text-primary focus:ring-primary bg-surface border-outline-variant" 
                                                />
                                                Wifi Incluido
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.aire_acondicionado} 
                                                    onChange={(e) => setForm({ ...form, aire_acondicionado: e.target.checked })} 
                                                    className="rounded text-primary focus:ring-primary bg-surface border-outline-variant" 
                                                />
                                                Aire Acondicionado
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.ventilador} 
                                                    onChange={(e) => setForm({ ...form, ventilador: e.target.checked })} 
                                                    className="rounded text-primary focus:ring-primary bg-surface border-outline-variant" 
                                                />
                                                Ventilador
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2">
                                    <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface cursor-pointer">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-opacity-95 cursor-pointer">
                                        {editandoId ? 'Guardar Cambios' : 'Añadir Habitación'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Notificar a Admin/Supervisor */}
            <EnviarNotificacionModal
                isOpen={Boolean(notificarHabitacion)}
                onClose={() => setNotificarHabitacion(null)}
                habitacionNumero={notificarHabitacion || undefined}
            />
        </div>
    );
};

export default HabitacionesCRUD;