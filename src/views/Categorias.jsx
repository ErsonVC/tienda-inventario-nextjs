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
    if (window.confirm('¿Eliminar categoría?')) {
      try {
        await api.delete(`/categorias/${id}`);
        cargar();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Categorías</h2>
        <p className="text-gray-500 dark:text-gray-400">Organiza tus productos por grupos</p>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50">
        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
          {editando ? '✏️ Editar' : '✨ Nueva'} Categoría
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              className={inputClass}
              placeholder="Nombre de la categoría (ej: Lácteos)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              onClick={guardar}
            >
              {editando ? 'Guardar' : 'Agregar'}
            </button>
            {editando && (
              <button 
                className="px-6 py-2.5 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all"
                onClick={() => { setEditando(null); setNombre(''); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Nombre de Categoría</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-8 py-10 text-center text-gray-400 italic">No hay categorías registradas</td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-4 font-bold text-gray-700 dark:text-gray-200">
                    {cat.nombre}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                        onClick={() => editar(cat)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                        onClick={() => eliminar(cat.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Categorias;