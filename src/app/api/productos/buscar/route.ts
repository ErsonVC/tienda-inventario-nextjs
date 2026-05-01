import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pagina = parseInt(searchParams.get('pagina') || '0', 10);
  const tamanio = parseInt(searchParams.get('tamanio') || '10', 10);
  const nombre = searchParams.get('nombre') || '';

  const whereClause = nombre ? { nombre: { contains: nombre, mode: 'insensitive' as const } } : {};

  const totalElements = await prisma.productos.count({ where: whereClause });
  const productos = await prisma.productos.findMany({
    where: whereClause,
    skip: pagina * tamanio,
    take: tamanio,
    include: {
      categorias: true
    }
  });

  const content = productos.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    stockActual: p.stock_actual,
    stockMinimo: p.stock_minimo,
    tipoVenta: p.tipo_venta,
    categoria: { id: p.categorias.id, nombre: p.categorias.nombre }
  }));

  return NextResponse.json({
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / tamanio)
  });
}
