import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalProductos,
      totalCategorias,
      productos,
      comprasMes,
      ventasMes,
      gastosProveedorRaw,
      topVentasRaw
    ] = await Promise.all([
      prisma.productos.count(),
      prisma.categorias.count(),
      prisma.productos.findMany(),
      prisma.compras.aggregate({
        where: { fecha: { gte: start, lte: end } },
        _sum: { total: true }
      }),
      prisma.ventas.aggregate({
        where: { fecha: { gte: start, lte: end } },
        _sum: { total: true }
      }),
      // Gastos por proveedor
      prisma.proveedores.findMany({
        select: {
          nombre: true,
          compras: {
            where: { fecha: { gte: start, lte: end } },
            select: { total: true }
          }
        }
      }),
      // Top productos vendidos (usamos detalles_venta)
      prisma.productos.findMany({
        select: {
          nombre: true,
          detalles_venta: {
            where: {
              ventas: { fecha: { gte: start, lte: end } }
            },
            select: { cantidad: true }
          }
        }
      })
    ]);

    // Procesar gastos por proveedor
    const gastosPorProveedor = gastosProveedorRaw
      .map(p => ({
        nombre: p.nombre,
        total: p.compras.reduce((sum, c) => sum + Number(c.total), 0)
      }))
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Procesar top productos vendidos
    const productosMasVendidos = topVentasRaw
      .map(p => ({
        nombre: p.nombre,
        cantidad: p.detalles_venta.reduce((sum, d) => sum + Number(d.cantidad), 0)
      }))
      .filter(p => p.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const bajoStockCount = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length;
    const gastos = Number(comprasMes._sum.total || 0);
    const ingresos = Number(ventasMes._sum.total || 0);

    return NextResponse.json({
      totalProductos,
      totalCategorias,
      bajoStock: bajoStockCount,
      gastos,
      ingresos,
      gastosPorProveedor,
      productosMasVendidos
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
