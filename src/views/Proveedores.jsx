"use client";

import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [editando, setEditando] = useState(null);
  const [activeTab, setActiveTab] = useState('lista');

  const [productos, setProductos] = useState([]);
  const [compraForm, setCompraForm] = useState({ proveedorId: '', total: 0 });
  const [detallesCompra, setDetallesCompra] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrTexto, setOcrTexto] = useState('');
  const [ocrMensaje, setOcrMensaje] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    cargarProveedores();
    cargarProductos();
  }, []);

  const cargarProveedores = async () => {
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/buscar?pagina=0&tamanio=1000');
      setProductos(res.data.content);
    } catch (error) {
      console.error("Error:", error);
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
    if (window.confirm("¿Eliminar proveedor?")) {
      await api.delete(`/proveedores/${id}`);
      cargarProveedores();
    }
  };

  const agregarDetalle = () => {
    if (!productoSeleccionado || !cantidad || !precioUnitario) return;
    const prod = productos.find(p => p.id.toString() === productoSeleccionado.toString());
    if (!prod) return;

    const nuevoDetalle = {
      producto: { id: prod.id, nombre: prod.nombre },
      cantidad: parseFloat(cantidad),
      precioUnitario: parseFloat(precioUnitario)
    };
    const nuevosDetalles = [...detallesCompra, nuevoDetalle];
    setDetallesCompra(nuevosDetalles);

    const total = nuevosDetalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);
    setCompraForm({ ...compraForm, total });

    setProductoSeleccionado('');
    setCantidad('');
    setPrecioUnitario('');
  };

  const registrarCompra = async () => {
    if (!compraForm.proveedorId || detallesCompra.length === 0) return;

    const payload = {
      proveedorId: compraForm.proveedorId,
      total: compraForm.total,
      detalles: detallesCompra.map(d => ({
        productoId: d.producto.id,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };

    try {
      await api.post('/compras', payload);
      setCompraForm({ proveedorId: '', total: 0 });
      setDetallesCompra([]);
      setOcrTexto('');
      setOcrMensaje('');
      setActiveTab('lista');
      cargarProductos();
      alert("¡Stock actualizado!");
    } catch (error) {
      alert("Error al registrar compra");
    }
  };

  // OCR con Google Cloud Vision
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setOcrMensaje('Procesando imagen con Google Cloud Vision...');
    setOcrTexto('');

    try {
      // Convertir imagen a base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      // Enviar al endpoint OCR
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      const data = await res.json();

      if (data.error) {
        setOcrMensaje(`❌ Error: ${data.error}`);
        setIsScanning(false);
        return;
      }

      setOcrTexto(data.textoDetectado || '');
      setOcrMensaje(data.mensaje);

      // Si se detectaron items, intentar mapearlos a productos existentes
      if (data.items && data.items.length > 0) {
        const detallesMapeados = [];

        for (const item of data.items) {
          // Buscar coincidencia por nombre similar
          const productoMatch = productos.find(p =>
            p.nombre.toLowerCase().includes(item.descripcion.toLowerCase()) ||
            item.descripcion.toLowerCase().includes(p.nombre.toLowerCase())
          );

          if (productoMatch) {
            detallesMapeados.push({
              producto: { id: productoMatch.id, nombre: productoMatch.nombre },
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario
            });
          } else {
            // Si no hay match, agregar con nombre detectado (sin ID)
            detallesMapeados.push({
              producto: { id: null, nombre: `⚠️ ${item.descripcion} (sin match)` },
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario
            });
          }
        }

        setDetallesCompra(detallesMapeados);
        setCompraForm(prev => ({ ...prev, total: data.totalDetectado || detallesMapeados.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0) }));
      }

    } catch (error) {
      console.error('Error OCR:', error);
      setOcrMensaje('❌ Error al procesar la imagen. Verifica tu conexión y API Key.');
    }

    setIsScanning(false);
    // Limpiar el input para permitir re-subir
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Proveedores</h2>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus suministros e ingresos de mercadería</p>
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        <button
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'lista' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('lista')}
        >
          Directorio
        </button>
        <button
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'nuevaCompra' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('nuevaCompra')}
        >
          Nueva Compra
        </button>
      </div>

      {activeTab === 'lista' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50 sticky top-8">
              <h3 className="text-lg font-black mb-6">{editando ? '✏️ Editar' : '✨ Nuevo'} Proveedor</h3>
              <div className="space-y-4">
                <input className={inputClass} name="nombre" placeholder="Nombre / Empresa" value={form.nombre} onChange={handleChange} />
                <input className={inputClass} name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
                <input className={inputClass} name="email" placeholder="Email" value={form.email} onChange={handleChange} />
                <input className={inputClass} name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} />
                <div className="pt-4">
                  <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20" onClick={guardarProveedor}>
                    {editando ? 'Guardar Cambios' : 'Registrar Proveedor'}
                  </button>
                  {editando && (
                    <button className="w-full py-3 mt-2 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all" onClick={() => {setEditando(null); setForm({ nombre: '', telefono: '', email: '', direccion: '' })}}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {proveedores.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 group hover:border-indigo-300 transition-colors">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">{p.nombre}</h4>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                  <p className="flex items-center gap-2"><span>📞</span> {p.telefono || 'Sin teléfono'}</p>
                  <p className="flex items-center gap-2"><span>✉️</span> {p.email || 'Sin email'}</p>
                  <p className="flex items-center gap-2"><span>📍</span> {p.direccion || 'Sin dirección'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 py-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg font-bold text-xs" onClick={() => editarProveedor(p)}>Editar</button>
                  <button className="flex-1 py-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg font-bold text-xs" onClick={() => eliminarProveedor(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black">Entrada de Mercadería</h3>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    disabled={isScanning}
                    className={`px-6 py-2 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors ${
                      isScanning
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isScanning ? (
                      <>
                        <span className="animate-spin">⏳</span> Procesando OCR...
                      </>
                    ) : (
                      <>📸 Escanear Boleta (OCR)</>
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje OCR */}
              {ocrMensaje && (
                <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${
                  ocrMensaje.includes('❌') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  ocrMensaje.includes('detectaron') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {ocrMensaje}
                </div>
              )}

              {/* Texto OCR detectado (colapsable) */}
              {ocrTexto && (
                <details className="mb-6">
                  <summary className="text-xs font-bold text-gray-400 uppercase cursor-pointer hover:text-gray-600 mb-2">
                    Ver texto detectado por OCR
                  </summary>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    {ocrTexto}
                  </pre>
                </details>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Proveedor de la compra</label>
                  <select className={inputClass} value={compraForm.proveedorId} onChange={(e) => setCompraForm({...compraForm, proveedorId: e.target.value})}>
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Agregar ítem manualmente</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <select className="w-full px-4 py-2.5 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
                        <option value="">Producto...</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <input className="w-20 px-3 py-2.5 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-shrink-0" type="number" placeholder="Cant." value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                    <input className="w-28 px-3 py-2.5 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-shrink-0" type="number" placeholder="Costo" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} />
                    <button className="h-11 w-11 flex-shrink-0 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center text-xl" onClick={agregarDetalle}>+</button>
                  </div>
                </div>
              </div>

              <div className="min-h-[200px] border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50/20">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Cant.</th>
                      <th className="px-6 py-4 text-right">Costo</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {detallesCompra.map((d, i) => (
                      <tr key={i} className={d.producto.id === null ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                        <td className="px-6 py-4 font-bold text-sm">{d.producto.nombre}</td>
                        <td className="px-6 py-4 text-center text-sm">{d.cantidad}</td>
                        <td className="px-6 py-4 text-right text-sm">S/ {d.precioUnitario.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-black text-indigo-600">S/ {(d.cantidad * d.precioUnitario).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            className="text-rose-400 hover:text-rose-600 text-xs font-bold"
                            onClick={() => {
                              const newDetalles = [...detallesCompra];
                              newDetalles.splice(i, 1);
                              setDetallesCompra(newDetalles);
                              setCompraForm({...compraForm, total: newDetalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0)});
                            }}
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                    {detallesCompra.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-gray-400 italic text-sm">
                          Agrega productos manualmente o escanea una boleta
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white">
              <h4 className="font-bold mb-1 opacity-80 uppercase text-[10px] tracking-widest">Total de la Compra</h4>
              <p className="text-4xl font-black mb-8">S/ {compraForm.total.toFixed(2)}</p>
              <button
                disabled={detallesCompra.length === 0 || !compraForm.proveedorId || detallesCompra.some(d => d.producto.id === null)}
                className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-lg hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
                onClick={registrarCompra}
              >
                PROCESAR INGRESO
              </button>
              {detallesCompra.some(d => d.producto.id === null) && (
                <p className="text-indigo-200 text-xs mt-4 text-center">⚠️ Hay productos sin vincular. Elimínalos o agrega los correctos manualmente.</p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h4 className="font-bold text-sm mb-3">💡 Cómo usar el OCR</h4>
              <ol className="text-xs text-gray-400 leading-relaxed space-y-2 list-decimal list-inside">
                <li>Haz clic en <strong>"Escanear Boleta"</strong></li>
                <li>Sube una foto clara de la boleta/factura</li>
                <li>El sistema detectará texto y extraerá los productos</li>
                <li>Revisa y corrige los datos antes de confirmar</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proveedores;
