import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { detalles } = body;

  try {
    const total = detalles.reduce((sum: number, d: any) => sum + (d.cantidad * d.precioUnitario), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Crear venta
      const venta = await tx.ventas.create({
        data: {
          fecha: new Date(),
          total: total,
          detalles_venta: {
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
              decrement: d.cantidad
            }
          }
        });
      }

      return venta;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating venta:", error);
    return NextResponse.json({ error: "Failed to create venta" }, { status: 500 });
  }
}
