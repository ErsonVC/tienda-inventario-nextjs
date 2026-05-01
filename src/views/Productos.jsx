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
  const TAMANIO = 5;

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
      alert("Por favor completa los campos obligatorios (Nombre, Precio y Categoría)");
      return;
    }
    const payload = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      tipoVenta: form.tipoVenta,
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
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await api.delete(`/productos/${id}`);
      buscar();
    }
  };

  const unidad = (p) => p.tipoVenta === 'GRANEL' ? 'kg' : 'und';

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white text-center sm:text-left">Productos</h2>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 mb-10 overflow-hidden">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-200">
          {editando ? '📝 Editar Producto' : '➕ Nuevo Producto'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Nombre</label>
            <input className={inputClass} name="nombre" placeholder="Ej: Arroz Costeño" value={form.nombre} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Precio</label>
            <input className={inputClass} name="precio" placeholder="0.00" type="number" value={form.precio} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Tipo de Venta</label>
            <select className={inputClass} name="tipoVenta" value={form.tipoVenta} onChange={handleChange}>
              <option value="UNIDAD">Unidad</option>
              <option value="GRANEL">Granel</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Stock Actual</label>
            <input className={inputClass} name="stockActual" placeholder="0" type="number" value={form.stockActual} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Stock Mínimo</label>
            <input className={inputClass} name="stockMinimo" placeholder="0" type="number" value={form.stockMinimo} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Categoría</label>
            <select className={inputClass} name="categoriaId" value={form.categoriaId} onChange={handleChange}>
              <option value="">-- Seleccionar --</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button className="flex-1 sm:flex-none px-10 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-600/20 transition-all active:scale-95" onClick={guardar}>
            {editando ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
          {editando && (
            <button className="flex-1 sm:flex-none px-10 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all" onClick={limpiarForm}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Buscador y Filtro */}
      <div className="bg-white dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className={`${inputClass} pl-10`}
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className={`${inputClass} md:w-64`}
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <button 
            className="w-full md:w-auto px-6 py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-purple-600 transition-colors"
            onClick={() => { setBusqueda(''); setCategoriaFiltro(''); }}
          >
            Limpiar filtros
          </button>
          <a
            href="http://localhost:8080/api/reportes/productos/excel"
            className="w-full md:w-auto px-6 py-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2 no-underline"
            download
          >
            <span>📥</span> Exportar Excel
          </a>
        </div>
      </div>

      {/* Vista de Escritorio (Tabla) */}
      <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Producto</th>
                <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Precio</th>
                <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Stock</th>
                <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Categoría</th>
                <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">No se encontraron productos</td>
                </tr>
              ) : (
                productos.map((p) => {
                  const isLowStock = p.stockActual < p.stockMinimo;
                  return (
                    <tr key={p.id} className={`group hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors ${isLowStock ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{p.nombre}</div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{p.tipoVenta}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-gray-900 dark:text-white">S/ {p.precio.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isLowStock ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                          {p.stockActual} {unidad(p)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">Min: {p.stockMinimo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-bold">
                          {p.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" onClick={() => editar(p)}>
                            <span className="text-lg">✏️</span>
                          </button>
                          <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" onClick={() => eliminar(p.id)}>
                            <span className="text-lg">🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Móvil (Cards) */}
      <div className="md:hidden flex flex-col gap-4">
        {productos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center text-gray-400 italic border border-gray-100 dark:border-gray-700">No se encontraron productos</div>
        ) : (
          productos.map((p) => {
            const isLowStock = p.stockActual < p.stockMinimo;
            return (
              <div key={p.id} className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border ${isLowStock ? 'border-red-200 dark:border-red-900/50 bg-red-50/10' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{p.nombre}</h4>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{p.tipoVenta}</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold">
                    {p.categoria.nombre}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Precio</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">S/ {p.precio.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Stock</div>
                    <div className={`text-lg font-bold ${isLowStock ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                      {p.stockActual} <span className="text-sm">{unidad(p)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">Min: {p.stockMinimo}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-95" onClick={() => editar(p)}>
                    <span className="text-xl">✏️</span> Editar
                  </button>
                  <button className="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-95" onClick={() => eliminar(p.id)}>
                    <span className="text-xl">🗑️</span> Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            onClick={() => setPagina(p => p - 1)}
            disabled={pagina === 0}>
            ◀️
          </button>
          <span className="text-sm font-bold text-gray-500">
            Página <span className="text-gray-900 dark:text-white">{pagina + 1}</span> de {totalPaginas}
          </span>
          <button
            className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina >= totalPaginas - 1}>
            ▶️
          </button>
        </div>
      )}
    </div>
  );
}

export default Productos;