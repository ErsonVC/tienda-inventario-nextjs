"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../api/axios';

function Navbar() {
  const [bajoStock, setBajoStock] = useState([]);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    cargarAlertas();
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const cargarAlertas = async () => {
    try {
      const res = await api.get('/productos/bajo-stock');
      setBajoStock(res.data);
    } catch (error) {
      console.error("Error cargando alertas:", error);
    }
  };

  const toggleAlertas = async () => {
    if (!mostrarAlertas) {
      await cargarAlertas();
    }
    setMostrarAlertas(!mostrarAlertas);
  };

  return (
    <nav className="bg-[#1e1e2e] text-white relative shadow-xl z-50">
      <div className="flex items-center justify-between py-4 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Botón Hamburguesa (solo móvil) */}
          <button 
            className="sm:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuAbierto ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          <Link href="/" className="flex items-center gap-2 no-underline text-white">
            <span className="text-2xl">🛒</span>
            <h2 className="text-xl font-bold m-0 hidden sm:block">Mi Tienda</h2>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Enlaces de Escritorio */}
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-300 hover:text-purple-400 font-semibold transition-colors">
              Inicio
            </Link>
            <Link href="/categorias" className="text-gray-300 hover:text-purple-400 font-semibold transition-colors">
              Categorías
            </Link>
            <Link href="/productos" className="text-gray-300 hover:text-purple-400 font-semibold transition-colors">
              Productos
            </Link>
          </div>

          {/* Campana de notificaciones */}
          <div className="relative cursor-pointer text-2xl p-2" onClick={toggleAlertas}>
            🔔
            {bajoStock.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-md border border-[#1e1e2e]">
                {bajoStock.length}
              </span>
            )}

            {/* Dropdown de alertas */}
            {mostrarAlertas && (
              <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 min-w-[300px] shadow-2xl z-[999] border border-gray-200 dark:border-gray-700">
                <strong className="block mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span>⚠️</span> Stock bajo
                </strong>
                <div className="max-h-60 overflow-y-auto pr-1">
                  {bajoStock.length === 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm text-center py-2 font-medium">Todo en orden ✅</p>
                  ) : (
                    bajoStock.map((p) => (
                      <div key={p.id} className="flex justify-between items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="font-medium text-sm truncate max-w-[150px]" title={p.nombre}>{p.nombre}</span>
                        <span className="text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                          {p.stockActual} / {p.stockMinimo} <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal uppercase">{p.tipoVenta === 'GRANEL' ? 'kg' : 'un'}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      <div className={`sm:hidden absolute top-full left-0 w-full bg-[#1e1e2e] border-t border-gray-800 transition-all duration-300 ease-in-out ${menuAbierto ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex flex-col p-4 gap-2 shadow-2xl">
          <Link href="/dashboard" className="p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-lg flex items-center gap-3">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/categorias" className="p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-lg flex items-center gap-3">
            <span>📁</span> Categorías
          </Link>
          <Link href="/productos" className="p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-lg flex items-center gap-3">
            <span>📦</span> Productos
          </Link>
          <Link href="/proveedores" className="p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-lg flex items-center gap-3">
            <span>🚚</span> Proveedores
          </Link>
          <Link href="/ventas" className="p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-lg flex items-center gap-3">
            <span>💰</span> Ventas
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;