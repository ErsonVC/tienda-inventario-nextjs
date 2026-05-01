import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const productos = await prisma.productos.findMany();
  const bajoStock = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo));
  
  // Convert fields for frontend compatibility (camelCase)
  const formatted = bajoStock.map(p => ({
    ...p,
    precio: Number(p.precio),
    stockActual: Number(p.stock_actual),
    stockMinimo: Number(p.stock_minimo),
    tipoVenta: p.tipo_venta,
  }));
  
  return NextResponse.json(formatted);
}
