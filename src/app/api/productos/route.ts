import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarAlertaStockBajo } from '@/lib/mail';

export async function POST(req: Request) {
  const body = await req.json();
  const producto = await prisma.productos.create({
    data: {
      nombre: body.nombre,
      precio: body.precio,
      stock_actual: body.stockActual,
      stock_minimo: body.stockMinimo,
      tipo_venta: body.tipoVenta,
      categoria_id: BigInt(body.categoriaId)
    },
    include: {
      categorias: true
    }
  });

  if (Number(producto.stock_actual) <= Number(producto.stock_minimo)) {
    enviarAlertaStockBajo(producto.nombre, Number(producto.stock_actual), Number(producto.stock_minimo));
  }
  
  const response = {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    stockActual: Number(producto.stock_actual),
    stockMinimo: Number(producto.stock_minimo),
    tipoVenta: producto.tipo_venta,
    categoria: { id: producto.categorias.id, nombre: producto.categorias.nombre }
  };
  
  return NextResponse.json(response);
}
