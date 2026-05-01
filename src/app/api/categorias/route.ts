import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categorias = await prisma.categorias.findMany();
  return NextResponse.json(categorias);
}

export async function POST(req: Request) {
  const body = await req.json();
  const categoria = await prisma.categorias.create({
    data: { nombre: body.nombre }
  });
  return NextResponse.json(categoria);
}
