import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proveedores = await prisma.proveedores.findMany();
  return NextResponse.json(proveedores);
}

export async function POST(req: Request) {
  const body = await req.json();
  const proveedor = await prisma.proveedores.create({
    data: { 
      nombre: body.nombre,
      direccion: body.direccion,
      email: body.email,
      telefono: body.telefono
    }
  });
  return NextResponse.json(proveedor);
}
