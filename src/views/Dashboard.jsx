"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalCategorias: 0,
    bajoStock: 0,
    gastos: 0,
    ingresos: 0,
    gastosPorProveedor: [],
    productosMasVendidos: []
  });
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resStats, resBajoStock] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/productos/bajo-stock')
      ]);

      setStats({
        totalProductos: resStats.data.totalProductos,
        totalCategorias: resStats.data.totalCategorias,
        bajoStock: resStats.data.bajoStock,
        gastos: resStats.data.gastos,
        ingresos: resStats.data.ingresos,
        gastosPorProveedor: resStats.data.gastosPorProveedor || [],
        productosMasVendidos: resStats.data.productosMasVendidos || []
      });

      const chartData = resBajoStock.data.map(p => ({
        name: p.nombre,
        stock: p.stockActual,
        minimo: p.stockMinimo,
        diferencia: p.stockMinimo - p.stockActual
      })).sort((a, b) => b.diferencia - a.diferencia).slice(0, 5);

      setProductosBajoStock(chartData);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setLoading(false);
    }
  };

  const Card = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClass} bg-opacity-10`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Análisis de rendimiento mensual</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-sm">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          Datos en tiempo real
        </div>
      </div>
      
      {/* 1. Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Productos" 
          value={stats.totalProductos} 
          icon="📦" 
          colorClass="text-blue-500 bg-blue-500"
        />
        <Card 
          title="Ingresos" 
          value={`S/ ${stats.ingresos.toLocaleString()}`} 
          icon="💰" 
          colorClass="text-emerald-500 bg-emerald-500"
        />
        <Card 
          title="Gastos" 
          value={`S/ ${stats.gastos.toLocaleString()}`} 
          icon="💸" 
          colorClass="text-rose-500 bg-rose-500"
        />
        <Card 
          title="Alertas Stock" 
          value={stats.bajoStock} 
          icon="⚠️" 
          colorClass="text-amber-500 bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 2. Gráfico Principal: Gastos y Ventas */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Inversión por Proveedor</h3>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Gastado</p>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">S/ {stats.gastos.toFixed(2)}</p>
            </div>
          </div>
          {stats.gastosPorProveedor.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gastosPorProveedor} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.05} />
                  <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                    contentStyle={{borderRadius: '1rem', border: 'none', backgroundColor: '#111827', color: '#fff'}}
                  />
                  <Bar dataKey="total" name="Gasto" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Sin datos este mes</div>
          )}
        </div>

        {/* 3. Productos más vendidos */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Productos Estrella</h3>
          <div className="space-y-6">
            {stats.productosMasVendidos.length > 0 ? stats.productosMasVendidos.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  <p className="font-bold text-sm text-gray-700 dark:text-gray-300">{p.nombre}</p>
                </div>
                <p className="font-black text-indigo-600 dark:text-indigo-400">{p.cantidad} <span className="text-[10px] text-gray-400 font-normal">UDS</span></p>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-400 text-sm">Sin ventas este mes</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 4. Stock Crítico */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Alertas de Inventario</h3>
          {productosBajoStock.length > 0 ? (
            <div className="space-y-4">
              {productosBajoStock.map((p, i) => (
                <div key={i} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400">Stock Crítico: {p.stock} / Mín: {p.minimo}</p>
                  </div>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full" 
                      style={{ width: `${(Number(p.stock) / Number(p.minimo)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-emerald-500 font-bold">
              ✅ Stock bajo control
            </div>
          )}
        </div>

        {/* 5. Balance Neto */}
        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Balance Neto</h3>
            <p className="text-indigo-100 text-sm opacity-80">Diferencia entre ingresos y gastos del mes</p>
          </div>
          <div className="py-8">
            <h2 className="text-5xl font-black tracking-tighter">
              S/ {(stats.ingresos - stats.gastos).toLocaleString()}
            </h2>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 p-4 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Eficiencia</p>
              <p className="text-lg font-bold">
                {stats.gastos > 0 ? ((stats.ingresos / stats.gastos) * 100).toFixed(1) : '100'}%
              </p>
            </div>
            <div className="flex-1 bg-white/10 p-4 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
              <p className="text-lg font-bold">{(stats.ingresos - stats.gastos) >= 0 ? 'Positivo' : 'Alerta'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
