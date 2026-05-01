"use client";

import { useEffect, useState } from 'react';
import api from '../api/axios';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const res = await api.get('/categorias');
      setCategorias(res.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) return;

    try {
      if (editando) {
        await api.put(`/categorias/${editando.id}`, { nombre });
        setEditando(null);
      } else {
        await api.post('/categorias', { nombre });
      }
      setNombre('');
      cargar();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const editar = (categoria) => {
    setEditando(categoria);
    setNombre(categoria.nombre);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await api.delete(`/categorias/${id}`);
        cargar();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white text-center sm:text-left">Categorías</h2>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 mb-10 overflow-hidden">
        <h3 className="text-xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {editando ? '📝 Editar Categoría' : '➕ Nueva Categoría'}
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Nombre de la categoría</label>
            <input
              className={inputClass}
              placeholder="Ej: Lácteos, Abarrotes..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              className="flex-1 sm:flex-none px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-600/20 transition-all active:scale-95 h-[52px]"
              onClick={guardar}
            >
              {editando ? 'Actualizar' : 'Agregar'}
            </button>
            {editando && (
              <button 
                className="flex-1 sm:flex-none px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all h-[52px]"
                onClick={() => { setEditando(null); setNombre(''); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vista de Escritorio (Tabla) */}
      <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">ID</th>
              <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Nombre</th>
              <th className="px-6 py-5 font-bold text-gray-400 uppercase text-[10px] tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-gray-400 italic">No hay categorías registradas</td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr key={cat.id} className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">#{cat.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{cat.nombre}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        onClick={() => editar(cat)}
                        title="Editar"
                      >
                        <span className="text-lg">✏️</span>
                      </button>
                      <button 
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        onClick={() => eliminar(cat.id)}
                        title="Eliminar"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil (Cards) */}
      <div className="md:hidden flex flex-col gap-4">
        {categorias.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center text-gray-400 italic border border-gray-100 dark:border-gray-700">No hay categorías registradas</div>
        ) : (
          categorias.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">#{cat.id}</span>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{cat.nombre}</h4>
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-95" onClick={() => editar(cat)}>
                  <span className="text-xl">✏️</span> Editar
                </button>
                <button className="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-95" onClick={() => eliminar(cat.id)}>
                  <span className="text-xl">🗑️</span> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Categorias;