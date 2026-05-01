"use client";

import { useEffect, useState } from 'react';
import api from '../api/axios';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [totalVenta, setTotalVenta] = useState(0);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  useEffect(() => {
    cargarProductos();
    cargarHistorial();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/buscar?pagina=0&tamanio=1000');
      setProductos(res.data.content);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await api.get('/ventas');
      setHistorialVentas(res.data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const agregarDetalle = () => {
    if (!productoSeleccionado || !cantidad) return;
    const prod = productos.find(p => p.id.toString() === productoSeleccionado.toString());

    if (!prod) return;

    if (parseFloat(cantidad) > Number(prod.stockActual)) {
      alert(`Stock insuficiente. Disponible: ${prod.stockActual}`);
      return;
    }

    const detalleExistente = detallesVenta.find(d => d.producto.id === prod.id);
    let nuevosDetalles;

    if (detalleExistente) {
      nuevosDetalles = detallesVenta.map(d =>
        d.producto.id === prod.id
        ? { ...d, cantidad: d.cantidad + parseFloat(cantidad) }
        : d
      );
    } else {
      nuevosDetalles = [...detallesVenta, {
        producto: { id: prod.id, nombre: prod.nombre },
        cantidad: parseFloat(cantidad),
        precioUnitario: prod.precio
      }];
    }

    setDetallesVenta(nuevosDetalles);
    const total = nuevosDetalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);
    setTotalVenta(total);
    setProductoSeleccionado('');
    setCantidad('');
  };

  const quitarDetalle = (index) => {
    const nuevosDetalles = [...detallesVenta];
    nuevosDetalles.splice(index, 1);
    setDetallesVenta(nuevosDetalles);
    const total = nuevosDetalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);
    setTotalVenta(total);
  };

  const registrarVenta = async () => {
    if (detallesVenta.length === 0) return;

    const payload = {
      total: totalVenta,
      detalles: detallesVenta.map(d => ({
        productoId: d.producto.id,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    try {
      await api.post('/ventas', payload);
      setDetallesVenta([]);
      setTotalVenta(0);
      cargarProductos();
      cargarHistorial();
      alert("¡Venta completada!");
    } catch (error) {
      alert("Error al procesar la venta.");
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Punto de Venta</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestiona transacciones y revisa el historial</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Acumulado</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">S/ {totalVenta.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* COLUMNA POS: Venta Actual */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <select
                  className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id} disabled={Number(p.stockActual) <= 0}>
                      {p.nombre} — S/ {Number(p.precio).toFixed(2)} (Stock: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-20 px-3 py-3 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-shrink-0"
                type="number"
                min="1"
                placeholder="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
              <button
                className="h-12 w-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors active:scale-95 flex items-center justify-center text-xl"
                onClick={agregarDetalle}
              >
                +
              </button>
            </div>

            {/* Tabla de Venta Actual */}
            <div className="min-h-[300px] border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-900/20">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center">Cant.</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                    <th className="px-6 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {detallesVenta.map((d, i) => (
                    <tr key={i} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 font-medium">{d.producto.nombre}</td>
                      <td className="px-6 py-4 text-center">{d.cantidad}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        S/ {(d.cantidad * d.precioUnitario).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => quitarDetalle(i)} className="text-rose-500 hover:scale-110 transition-transform">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {detallesVenta.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic">
                        No hay productos en la venta actual
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-30"
                onClick={registrarVenta}
                disabled={detallesVenta.length === 0}
              >
                FINALIZAR VENTA (S/ {totalVenta.toFixed(2)})
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA HISTORIAL */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <span>📋</span> Historial Reciente
          </h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingHistorial ? (
              <div className="text-center py-10 animate-pulse text-gray-400">Cargando historial...</div>
            ) : historialVentas.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-400">#{v.id.toString().slice(-4)} • {new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="font-black text-indigo-600 dark:text-indigo-400">S/ {Number(v.total).toFixed(2)}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {v.detalles_venta.map(d => `${d.cantidad}x ${d.productos.nombre}`).join(', ')}
                </div>
              </div>
            ))}
            {!loadingHistorial && historialVentas.length === 0 && (
              <p className="text-center py-10 text-gray-400 italic">No hay ventas registradas</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Ventas;
