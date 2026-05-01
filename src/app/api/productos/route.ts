import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const producto = await prisma.productos.create({
    data: {
      nombre: body.nombre,
      precio: body.precio,
      stock_actual: body.stockActual,
      stock_minimo: body.stockMinimo,
      tipo_venta: body.tipoVenta,
      categoria_id: BigInt(body.categoria.id)
    }
  });
  return NextResponse.json(producto);
}
