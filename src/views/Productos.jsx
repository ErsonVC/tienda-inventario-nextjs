"use client";

import { useEffect, useState } from 'react';
import api from '../api/axios';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const TAMANIO = 8;

  const [form, setForm] = useState({
    nombre: '', precio: '', tipoVenta: 'UNIDAD',
    stockActual: '', stockMinimo: '', categoriaId: ''
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    setPagina(0);
  }, [busqueda, categoriaFiltro]);

  useEffect(() => {
    buscar();
  }, [pagina, busqueda, categoriaFiltro]);

  const cargarCategorias = async () => {
    const res = await api.get('/categorias');
    setCategorias(res.data);
  };

  const buscar = async () => {
    const params = { pagina, tamanio: TAMANIO };
    if (busqueda) params.nombre = busqueda;
    if (categoriaFiltro) params.categoriaId = categoriaFiltro;
    try {
      const res = await api.get('/productos/buscar', { params });
      setProductos(res.data.content);
      setTotalPaginas(res.data.totalPages);
    } catch (error) {
      console.error("Error buscando productos:", error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const limpiarForm = () => {
    setForm({ nombre: '', precio: '', tipoVenta: 'UNIDAD', stockActual: '', stockMinimo: '', categoriaId: '' });
    setEditando(null);
  };

  const guardar = async () => {
    if (!form.nombre || !form.precio || !form.categoriaId) {
      alert("Faltan datos obligatorios");
      return;
    }
    const payload = {
      ...form,
      precio: parseFloat(form.precio),
      stockActual: parseFloat(form.stockActual || 0),
      stockMinimo: parseFloat(form.stockMinimo || 0),
      categoriaId: parseInt(form.categoriaId),
    };
    try {
      if (editando) {
        await api.put(`/productos/${editando.id}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      limpiarForm();
      buscar();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const editar = (p) => {
    setEditando(p);
    setForm({
      nombre: p.nombre, precio: p.precio, tipoVenta: p.tipoVenta,
      stockActual: p.stockActual, stockMinimo: p.stockMinimo,
      categoriaId: p.categoria.id,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (id) => {
    if (window.confirm('¿Eliminar producto?')) {
      await api.delete(`/productos/${id}`);
      buscar();
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Inventario</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus productos y existencias</p>
        </div>
        <a
          href="http://localhost:8080/api/reportes/productos/excel"
          className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 no-underline text-sm"
        >
          📥 Exportar Excel
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario Lateral (Ocupa 1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50 sticky top-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              {editando ? '✏️ Editar' : '✨ Nuevo'} Producto
            </h3>
            <div className="space-y-4">
              <input className={inputClass} name="nombre" placeholder="Nombre del producto" value={form.nombre} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <input className={inputClass} name="precio" placeholder="Precio" type="number" value={form.precio} onChange={handleChange} />
                <select className={inputClass} name="tipoVenta" value={form.tipoVenta} onChange={handleChange}>
                  <option value="UNIDAD">Unidad</option>
                  <option value="GRANEL">Granel</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className={inputClass} name="stockActual" placeholder="Stock Actual" type="number" value={form.stockActual} onChange={handleChange} />
                <input className={inputClass} name="stockMinimo" placeholder="Mínimo" type="number" value={form.stockMinimo} onChange={handleChange} />
              </div>
              <select className={inputClass} name="categoriaId" value={form.categoriaId} onChange={handleChange}>
                <option value="">Categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              
              <div className="pt-4 space-y-2">
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95" onClick={guardar}>
                  {editando ? 'Actualizar Cambios' : 'Registrar Producto'}
                </button>
                {editando && (
                  <button className="w-full py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all" onClick={limpiarForm}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listado (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                className={`${inputClass} pl-10 h-11`}
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <select
              className={`${inputClass} w-48 h-11`}
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Info</th>
                    <th className="px-6 py-5">Stock</th>
                    <th className="px-6 py-5">Precio</th>
                    <th className="px-6 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {productos.map((p) => {
                    const isLowStock = p.stockActual < p.stockMinimo;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{p.nombre}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">{p.categoria.nombre}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`font-black ${isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {p.stockActual} <span className="text-[10px] font-normal text-gray-400">{p.tipoVenta === 'GRANEL' ? 'kg' : 'und'}</span>
                          </p>
                          {isLowStock && <p className="text-[8px] font-bold text-rose-400 uppercase animate-pulse">Stock Crítico</p>}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                          S/ {p.precio.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 transition-colors" onClick={() => editar(p)}>✏️</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 transition-colors" onClick={() => eliminar(p.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación Simplificada */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-20 transition-all"
                onClick={() => setPagina(p => p - 1)}
                disabled={pagina === 0}>
                ‹
              </button>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Pág {pagina + 1} de {totalPaginas}
              </span>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-20 transition-all"
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina >= totalPaginas - 1}>
                ›
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Productos;