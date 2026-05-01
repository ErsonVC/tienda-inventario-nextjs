"use client";

import { useEffect, useState } from 'react';
import api from '../api/axios';

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [editando, setEditando] = useState(null);
  const [activeTab, setActiveTab] = useState('lista'); // 'lista' o 'nuevaCompra'
  
  // Estados para nueva compra
  const [productos, setProductos] = useState([]);
  const [compraForm, setCompraForm] = useState({ proveedorId: '', total: 0 });
  const [detallesCompra, setDetallesCompra] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');

  useEffect(() => {
    cargarProveedores();
    cargarProductos();
  }, []);

  const cargarProveedores = async () => {
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/buscar?pagina=0&tamanio=1000');
      setProductos(res.data.content);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardarProveedor = async () => {
    if (!form.nombre) return;
    try {
      if (editando) {
        await api.put(`/proveedores/${editando.id}`, form);
      } else {
        await api.post('/proveedores', form);
      }
      setForm({ nombre: '', telefono: '', email: '', direccion: '' });
      setEditando(null);
      cargarProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  const editarProveedor = (p) => {
    setEditando(p);
    setForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarProveedor = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar?")) {
      await api.delete(`/proveedores/${id}`);
      cargarProveedores();
    }
  };

  const agregarDetalle = () => {
    if (!productoSeleccionado || !cantidad || !precioUnitario) return;
    const prod = productos.find(p => p.id === parseInt(productoSeleccionado));
    const nuevoDetalle = {
      producto: { id: prod.id, nombre: prod.nombre },
      cantidad: parseFloat(cantidad),
      precioUnitario: parseFloat(precioUnitario)
    };
    const nuevosDetalles = [...detallesCompra, nuevoDetalle];
    setDetallesCompra(nuevosDetalles);
    
    // Recalcular total
    const total = nuevosDetalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);
    setCompraForm({ ...compraForm, total });
    
    setProductoSeleccionado('');
    setCantidad('');
    setPrecioUnitario('');
  };

  const registrarCompra = async () => {
    if (!compraForm.proveedorId || detallesCompra.length === 0) return;
    
    const payload = {
      proveedor: { id: parseInt(compraForm.proveedorId) },
      total: compraForm.total,
      detalles: detallesCompra.map(d => ({
        producto: { id: d.producto.id },
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    try {
      await api.post('/compras', payload);
      alert("Compra registrada con éxito y stock actualizado.");
      setCompraForm({ proveedorId: '', total: 0 });
      setDetallesCompra([]);
      setActiveTab('lista');
    } catch (error) {
      console.error(error);
      alert("Error al registrar compra");
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Proveedores</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button 
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'lista' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          onClick={() => setActiveTab('lista')}
        >
          Proveedores
        </button>
        <button 
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'nuevaCompra' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          onClick={() => setActiveTab('nuevaCompra')}
        >
          Registrar Compra
        </button>
      </div>

      {activeTab === 'lista' && (
        <>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl mb-8 border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 text-gray-700 dark:text-gray-200">
              {editando ? '📝 Editar Proveedor' : '➕ Nuevo Proveedor'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className={inputClass} name="nombre" placeholder="Nombre/Empresa" value={form.nombre} onChange={handleChange} />
              <input className={inputClass} name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
              <input className={inputClass} name="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <input className={inputClass} name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} />
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 sm:flex-none px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95" onClick={guardarProveedor}>
                {editando ? 'Actualizar' : 'Guardar Proveedor'}
              </button>
              {editando && (
                <button className="flex-1 sm:flex-none px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl transition-all" onClick={() => {setEditando(null); setForm({ nombre: '', telefono: '', email: '', direccion: '' })}}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {proveedores.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{p.nombre}</h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                  <p>📞 {p.telefono || 'N/A'}</p>
                  <p>✉️ {p.email || 'N/A'}</p>
                  <p>📍 {p.direccion || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 rounded-xl font-bold" onClick={() => editarProveedor(p)}>Editar</button>
                  <button className="flex-1 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 rounded-xl font-bold" onClick={() => eliminarProveedor(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'nuevaCompra' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Registrar Ingreso de Stock</h3>
            <button 
              className="w-full sm:w-auto px-6 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              onClick={() => {
                alert("📷 Abriendo cámara...\n\n(Simulación OCR Google Cloud Vision)\nEscaneando boleta...");
                // Simulación de respuesta OCR
                setTimeout(() => {
                  setCompraForm({...compraForm, total: 150.50});
                  setDetallesCompra([{
                    producto: { id: productos[0]?.id || 1, nombre: productos[0]?.nombre || 'Producto Detectado' },
                    cantidad: 10,
                    precioUnitario: 15.05
                  }]);
                  alert("✅ Boleta escaneada. Revisa los datos antes de guardar.");
                }, 1500);
              }}
            >
              <span>📸</span> Escanear Boleta (OCR)
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-600 mb-2">Proveedor</label>
            <select className={inputClass} value={compraForm.proveedorId} onChange={(e) => setCompraForm({...compraForm, proveedorId: e.target.value})}>
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-6">
            <h4 className="font-bold mb-4">Agregar Producto a la Factura</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <select className={`${inputClass} flex-[2]`} value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
                <option value="">-- Producto --</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input className={`${inputClass} flex-1`} type="number" placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              <input className={`${inputClass} flex-1`} type="number" placeholder="Precio Unit. (Costo)" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} />
              <button className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl active:scale-95 transition-all" onClick={agregarDetalle}>
                ➕
              </button>
            </div>
          </div>

          {/* Lista de Detalles */}
          {detallesCompra.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold mb-3">Detalle de Compra</h4>
              <div className="space-y-2">
                {detallesCompra.map((d, i) => (
                  <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-bold">{d.producto.nombre}</p>
                      <p className="text-xs text-gray-500">{d.cantidad} uds x S/ {d.precioUnitario}</p>
                    </div>
                    <div className="font-black">S/ {(d.cantidad * d.precioUnitario).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <span className="text-xl font-bold">Total Factura: </span>
                <span className="text-2xl font-black text-emerald-600">S/ {compraForm.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button 
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-all"
            onClick={registrarCompra}
          >
            CONFIRMAR COMPRA E INGRESAR STOCK
          </button>
        </div>
      )}
    </div>
  );
}

export default Proveedores;
