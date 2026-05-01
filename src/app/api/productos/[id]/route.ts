import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const producto = await prisma.productos.update({
    where: { id: BigInt(id) },
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.productos.delete({
    where: { id: BigInt(id) }
  });
  return new NextResponse(null, { status: 204 });
}
