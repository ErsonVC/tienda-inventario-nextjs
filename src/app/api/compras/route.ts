import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { proveedorId, detalles } = body;

  try {
    const total = detalles.reduce((sum: number, d: any) => sum + (d.cantidad * d.precioUnitario), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Crear compra
      const compra = await tx.compras.create({
        data: {
          fecha: new Date(),
          total: total,
          proveedor_id: BigInt(proveedorId),
          detalles_compra: {
            create: detalles.map((d: any) => ({
              cantidad: d.cantidad,
              precio_unitario: d.precioUnitario,
              producto_id: BigInt(d.productoId)
            }))
          }
        }
      });

      // Actualizar stock
      for (const d of detalles) {
        await tx.productos.update({
          where: { id: BigInt(d.productoId) },
          data: {
            stock_actual: {
              increment: d.cantidad
            }
          }
        });
      }

      return compra;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating compra:", error);
    return NextResponse.json({ error: "Failed to create compra" }, { status: 500 });
  }
}
