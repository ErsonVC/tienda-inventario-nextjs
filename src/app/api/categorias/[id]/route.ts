import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const categoria = await prisma.categorias.update({
    where: { id: BigInt(id) },
    data: { nombre: body.nombre }
  });
  return NextResponse.json(categoria);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.categorias.delete({
    where: { id: BigInt(id) }
  });
  return new NextResponse(null, { status: 204 });
}
