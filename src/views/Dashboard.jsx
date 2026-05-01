"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalCategorias: 0,
    bajoStock: 0,
    gastoMensual: 0 // Mocked for now until module is ready
  });
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Idealmente esto vendría de un endpoint /dashboard/stats
      // Por ahora lo simularemos obteniendo los datos existentes
      const [resCat, resBajoStock, resProd] = await Promise.all([
        api.get('/categorias'),
        api.get('/productos/bajo-stock'),
        api.get('/productos/buscar?pagina=0&tamanio=1') // Solo para obtener el totalElements si existiera, o usamos una heurística
      ]);

      // En el backend no tenemos endpoint para "total de productos" directo
      // Simularemos con los datos que tenemos o asumiremos 0 si no se puede
      const totalProd = resProd.data.totalElements || 0;

      setStats({
        totalProductos: totalProd,
        totalCategorias: resCat.data.length,
        bajoStock: resBajoStock.data.length,
        gastoMensual: 0.00
      });

      // Formatear datos para el gráfico
      const chartData = resBajoStock.data.map(p => ({
        name: p.nombre,
        stock: p.stockActual,
        minimo: p.stockMinimo,
        diferencia: p.stockMinimo - p.stockActual
      })).sort((a, b) => b.diferencia - a.diferencia).slice(0, 5); // Top 5 más críticos

      setProductosBajoStock(chartData);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setLoading(false);
    }
  };

  const Card = ({ title, value, icon, colorClass, link }) => (
    <Link href={link} className="block no-underline active:scale-95 transition-transform">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4`}></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h3>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Resumen General</h2>
      
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card 
          title="Total Productos" 
          value={stats.totalProductos} 
          icon="📦" 
          colorClass="from-blue-400 to-blue-600"
          link="/productos"
        />
        <Card 
          title="Categorías" 
          value={stats.totalCategorias} 
          icon="📁" 
          colorClass="from-purple-400 to-purple-600"
          link="/categorias"
        />
        <Card 
          title="Bajo Stock" 
          value={stats.bajoStock} 
          icon="⚠️" 
          colorClass="from-red-400 to-red-600"
          link="/productos"
        />
        <Card 
          title="Gastos del Mes" 
          value={`S/ ${stats.gastoMensual.toFixed(2)}`} 
          icon="💸" 
          colorClass="from-emerald-400 to-emerald-600"
          link="/proveedores"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Stock Crítico */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Top 5: Stock Crítico</h3>
          {productosBajoStock.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productosBajoStock} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1f2937', color: '#fff'}}
                  />
                  <Bar dataKey="stock" name="Stock Actual" radius={[4, 4, 0, 0]}>
                    {
                      productosBajoStock.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#ef4444" />
                      ))
                    }
                  </Bar>
                  <Bar dataKey="minimo" name="Stock Mínimo" fill="#6b7280" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-72 flex items-center justify-center text-gray-400">
               No hay productos con stock crítico 🎉
             </div>
          )}
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Accesos Rápidos</h3>
          <div className="flex flex-col gap-4">
            <Link href="/productos" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-gray-100 dark:border-gray-700 group">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform">➕</div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">Nuevo Producto</h4>
                <p className="text-xs text-gray-500">Registrar en inventario</p>
              </div>
            </Link>
            
            <Link href="/ventas" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border border-gray-100 dark:border-gray-700 group">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform">💰</div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">Registrar Venta</h4>
                <p className="text-xs text-gray-500">Generar nueva salida</p>
              </div>
            </Link>

            <Link href="/proveedores" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-gray-100 dark:border-gray-700 group">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform">🚚</div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Nueva Compra</h4>
                <p className="text-xs text-gray-500">Ingresar stock de proveedor</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Gráfico de Gastos por Proveedor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Gastos por Proveedor (Mes)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Alicorp', gasto: 1500 },
                { name: 'Gloria', gasto: 2300 },
                { name: 'Coca Cola', gasto: 1200 },
                { name: 'Nestlé', gasto: 800 }
              ]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}/>
                <Bar dataKey="gasto" name="Gasto (S/)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Productos Más Vendidos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Top Productos Más Vendidos</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Leche Evaporada', ventas: 120 },
                { name: 'Arroz Costeño', ventas: 95 },
                { name: 'Aceite Primor', ventas: 80 },
                { name: 'Gaseosa Inka Cola', ventas: 150 }
              ]} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1f2937', color: '#fff'}}/>
                <Bar dataKey="ventas" name="Unidades Vendidas" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
