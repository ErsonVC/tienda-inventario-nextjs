"use client";

import { useEffect, useState } from 'react';
import api from '../api/axios';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [totalVenta, setTotalVenta] = useState(0);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/buscar?pagina=0&tamanio=1000');
      setProductos(res.data.content);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const agregarDetalle = () => {
    if (!productoSeleccionado || !cantidad) return;
    const prod = productos.find(p => p.id === parseInt(productoSeleccionado));
    
    if (parseFloat(cantidad) > prod.stockActual) {
      alert(`Stock insuficiente. Stock actual: ${prod.stockActual}`);
      return;
    }

    const nuevoDetalle = {
      producto: { id: prod.id, nombre: prod.nombre },
      cantidad: parseFloat(cantidad),
      precioUnitario: prod.precio // Usamos el precio de venta actual del producto
    };
    
    const nuevosDetalles = [...detallesVenta, nuevoDetalle];
    setDetallesVenta(nuevosDetalles);
    
    // Recalcular total
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
        producto: { id: d.producto.id },
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    try {
      await api.post('/ventas', payload);
      alert("Venta registrada con éxito. Stock descontado.");
      setDetallesVenta([]);
      setTotalVenta(0);
      cargarProductos(); // Recargar para actualizar stock en el select
    } catch (error) {
      console.error(error);
      alert("Error al registrar venta. Verifique stock.");
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Punto de Venta</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        
        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 sm:p-6 rounded-2xl mb-6 border border-purple-100 dark:border-purple-900/30">
          <h4 className="font-bold mb-4 text-purple-900 dark:text-purple-300">Agregar Producto a la Venta</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <select className={`${inputClass} flex-[3]`} value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
              <option value="">-- Buscar Producto --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                  {p.nombre} (S/ {p.precio}) - Stock: {p.stockActual}
                </option>
              ))}
            </select>
            <input 
              className={`${inputClass} flex-1`} 
              type="number" 
              placeholder="Cant." 
              value={cantidad} 
              onChange={(e) => setCantidad(e.target.value)} 
            />
            <button className="py-3 px-8 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md" onClick={agregarDetalle}>
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de Detalles */}
        {detallesVenta.length > 0 ? (
          <div className="mb-8">
            <h4 className="font-bold mb-3 text-gray-700 dark:text-gray-300">Detalle de Boleta</h4>
            <div className="space-y-3">
              {detallesVenta.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-bold text-lg">{d.producto.nombre}</p>
                    <p className="text-sm text-gray-500">{d.cantidad} x S/ {d.precioUnitario.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl">S/ {(d.cantidad * d.precioUnitario).toFixed(2)}</span>
                    <button className="text-red-500 hover:bg-red-100 p-2 rounded-lg" onClick={() => quitarDetalle(i)}>❌</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-6 bg-gray-900 text-white rounded-2xl flex justify-between items-center shadow-inner">
              <span className="text-xl font-bold">TOTAL A COBRAR: </span>
              <span className="text-4xl font-black text-emerald-400">S/ {totalVenta.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 italic bg-gray-50 dark:bg-gray-900/30 rounded-2xl mb-8">
            No hay productos en la venta actual.
          </div>
        )}

        <button 
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          onClick={registrarVenta}
          disabled={detallesVenta.length === 0}
        >
          CONFIRMAR VENTA
        </button>
      </div>
    </div>
  );
}

export default Ventas;
