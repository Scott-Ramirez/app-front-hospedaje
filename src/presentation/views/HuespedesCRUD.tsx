import React, { useState, useEffect } from 'react';
import { useHuespedes } from '../hooks/useHuespedes';
import { useAuth } from '../context/AuthContext';

import {
    Search,
    Plus,
    Users,
    UserCheck,
    UserMinus,
    Edit3,
    Trash2,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Contact,
    RefreshCw
} from 'lucide-react';

interface HuespedFormData {
    id: string;
    nombre: string;
    dni: string;
    celular?: string;
}

export const HuespedesCRUD: React.FC = () => {
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
        huespedesFiltrados,
        handleNuevoClick,
        handleEditarClick,
        handleGuardar,
        handleEliminar
    } = useHuespedes();

    const { usuario } = useAuth();

    const esAdmin = usuario?.rol === 'admin';
    const [paginaActual, setPaginaActual] = useState<number>(1);
    const itemsPorPagina = 5;

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);



    const listaSegura = Array.isArray(huespedesFiltrados) ? huespedesFiltrados : [];
    const totalItems = listaSegura.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
    const indiceInicial = (paginaActual - 1) * itemsPorPagina;
    const indiceFinal = indiceInicial + itemsPorPagina;
    const huespedesPaginados = listaSegura.slice(indiceInicial, indiceFinal);

    return (
        <div className="p-6 max-w-[1280px] mx-auto text-on-surface">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Registro de Huéspedes</h2>
                    <p className="text-sm text-on-surface-variant">Base de datos centralizada de identificación de clientes.</p>
                </div>

                {/* BUSCADOR Y ACCIONES (NUNCA SE DESMONTA, EVITA EL DESENFOQUE) */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {cargando ? (
                            <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        )}
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DNI..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-on-surface w-[240px] transition-all"
                        />
                    </div>
                    
                    <button
                        onClick={handleNuevoClick}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                        <Plus className="h-4 w-4" /> Nuevo Huésped
                    </button>
                </div>
            </div>

            {/* INDICADORES BENTO OPTIMIZADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-green-500/10 text-green-600 rounded-lg w-fit">
                        <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Activos en Hotel</p>
                        <h3 className="text-3xl font-bold">{metrics.activos || 0}</h3>
                    </div>
                </div>

                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg w-fit">
                        <UserMinus className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Historial Histórico</p>
                        <h3 className="text-3xl font-bold">{metrics.historicos || 0}</h3>
                    </div>
                </div>

                <div className="bg-surface-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg w-fit">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-on-surface-variant uppercase font-medium">Total Registrados</p>
                        <h3 className="text-3xl font-bold">{metrics.total || 0}</h3>
                    </div>
                </div>
            </div>

            {/* TABLA DE HUÉSPEDES CON LOADING INTERNO */}
            <div className="bg-surface-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-bold text-on-surface-variant uppercase tracking-wider select-none">
                                <th className="py-4 px-5">Nombre Completo</th>
                                <th className="py-4 px-5">Documento de Identidad</th>
                                <th className="py-4 px-5">Número de Contacto</th>
                                <th className="py-4 px-5 text-center">Acciones de Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40 text-sm font-medium relative min-h-[200px]">
                            {cargando ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                            <p className="text-xs text-on-surface-variant">Buscando en el maestro...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : huespedesPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-on-surface-variant/80">
                                        Ningún huésped coincide con los criterios de búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                huespedesPaginados.map((guest: HuespedFormData) => (
                                    <tr key={guest.id} className="hover:bg-surface-container-lowest transition-colors group">
                                        <td className="py-3.5 px-5 font-bold text-on-surface flex items-center gap-3">
                                            <div className="p-1.5 bg-surface-container rounded-md text-on-surface-variant">
                                                <Contact className="h-4 w-4" />
                                            </div>
                                            {guest.nombre}
                                        </td>
                                        <td className="py-3.5 px-5 text-on-surface-variant font-mono text-xs">
                                            <span className="bg-surface-container px-2 py-1 rounded text-[11px] font-bold mr-1.5 uppercase text-primary">
                                                DNI
                                            </span>
                                            {guest.dni}
                                        </td>
                                        <td className="py-3.5 px-5 text-on-surface-variant text-xs font-mono">
                                            {guest.celular || <span className="text-gray-400 italic font-sans">Sin número</span>}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditarClick(guest as any)}
                                                    className="p-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-md transition-colors cursor-pointer"
                                                    title="Modificar ficha del huésped"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>

                                                {esAdmin && (
                                                    <button
                                                        onClick={() => handleEliminar(guest.id)}
                                                        className="p-1.5 border border-error/20 hover:bg-error/5 text-error rounded-md transition-colors cursor-pointer"
                                                        title="Eliminar del historial permanente"
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
                        Mostrando registros del <span className="text-on-surface">{totalItems === 0 ? 0 : indiceInicial + 1}</span> al <span className="text-on-surface">{Math.min(indiceFinal, totalItems)}</span> de un total de <span className="text-on-surface">{totalItems}</span> huéspedes.
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                            disabled={paginaActual === 1 || cargando}
                            className="p-1.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-lowest transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="text-xs font-bold px-3 text-on-surface-variant">
                            Página <span className="text-on-surface">{paginaActual}</span> de {totalPaginas}
                        </div>

                        <button
                            onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas || cargando}
                            className="p-1.5 rounded-md border border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-lowest transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL FORMULARIO DE HUÉSPED */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden text-on-surface">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-lg font-bold">
                                {editandoId ? 'Modificar Ficha de Huésped' : 'Registrar Nuevo Huésped'}
                            </h3>
                            <button onClick={() => setModalAbierto(false)} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGuardar}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        minLength={3}
                                        maxLength={150}
                                        value={form.nombre}
                                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                        className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                        placeholder="Ej. Juan Pérez Celis"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">DNI (8 dígitos)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-surface-container px-2 py-0.5 rounded pointer-events-none">
                                            DNI
                                        </span>
                                        <input
                                            type="text"
                                            required
                                            pattern="^[0-9]+$"
                                            minLength={8}
                                            maxLength={8}
                                            value={form.dni}
                                            onChange={(e) => setForm({ ...form, dni: e.target.value })}
                                            className="w-full bg-surface border border-outline-variant rounded-lg pl-14 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface font-mono"
                                            placeholder="12345678"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Celular (Opcional)</label>
                                    <input
                                        type="text"
                                        pattern="^[0-9]+$"
                                        minLength={9}
                                        maxLength={9}
                                        value={form.celular}
                                        onChange={(e) => setForm({ ...form, celular: e.target.value })}
                                        className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface font-mono"
                                        placeholder="987654321"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-opacity-95 cursor-pointer">
                                    {editandoId ? 'Guardar Cambios' : 'Registrar Huésped'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HuespedesCRUD;