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
  }, [pathname]);

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

  const NavLink = ({ href, children, emoji }) => {
    const active = pathname === href;
    return (
      <Link 
        href={href} 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all no-underline ${
          active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="text-sm">{emoji}</span>
        <span className="text-sm">{children}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-[#0f172a] text-white sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-opacity-90">
      <div className="flex items-center justify-between py-4 px-4 sm:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline text-white group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">🛒</div>
            <h2 className="text-xl font-black m-0 tracking-tighter hidden lg:block">JOY</h2>
          </Link>
          
          {/* Escritorio */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" emoji="📊">Dashboard</NavLink>
            <NavLink href="/productos" emoji="📦">Productos</NavLink>
            <NavLink href="/categorias" emoji="📁">Categorías</NavLink>
            <NavLink href="/ventas" emoji="💰">Ventas</NavLink>
            <NavLink href="/proveedores" emoji="🚚">Proveedores</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Campana */}
          <div className="relative cursor-pointer w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors" onClick={toggleAlertas}>
            <span className="text-xl">🔔</span>
            {bajoStock.length > 0 && (
              <span className="absolute top-2 right-2 bg-rose-500 w-2 h-2 rounded-full animate-ping"></span>
            )}

            {/* Dropdown Alertas */}
            {mostrarAlertas && (
              <div className="absolute top-12 right-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl p-6 min-w-[320px] shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-rose-500 uppercase text-xs tracking-widest">Alertas de Stock</h4>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold">{bajoStock.length} PRODUCTOS</span>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {bajoStock.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 text-sm italic">Todo bajo control ✨</p>
                  ) : (
                    bajoStock.map((p) => (
                      <div key={p.id} className="flex flex-col p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm truncate">{p.nombre}</span>
                          <span className="text-rose-500 font-black text-xs">{p.stockActual} <span className="text-[10px] font-normal opacity-60">uds</span></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <span className="text-2xl">{menuAbierto ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Móvil */}
      {menuAbierto && (
        <div className="md:hidden border-t border-white/5 bg-[#0f172a] p-4 flex flex-col gap-2 animate-in slide-in-from-top duration-300">
          <NavLink href="/dashboard" emoji="📊">Dashboard</NavLink>
          <NavLink href="/productos" emoji="📦">Productos</NavLink>
          <NavLink href="/categorias" emoji="📁">Categorías</NavLink>
          <NavLink href="/ventas" emoji="💰">Ventas</NavLink>
          <NavLink href="/proveedores" emoji="🚚">Proveedores</NavLink>
        </div>
      )}
    </nav>
  );
}

export default Navbar;