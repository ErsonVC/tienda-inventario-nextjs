import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_VISION_API = 'https://vision.googleapis.com/v1/images:annotate';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key de Google Cloud Vision no configurada' }, { status: 500 });
    }

    // Limpiar el base64 (quitar el prefijo data:image/...)
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // Llamar a Google Cloud Vision API
    const visionResponse = await fetch(`${GOOGLE_VISION_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }
        ]
      })
    });

    const visionData = await visionResponse.json();

    if (visionData.error) {
      return NextResponse.json({ error: visionData.error.message }, { status: 500 });
    }

    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({
        textoDetectado: '',
        items: [],
        totalDetectado: 0,
        mensaje: 'No se detectó texto en la imagen.'
      });
    }

    const textoCompleto = textAnnotations[0].description;

    // Parsear el texto para extraer items de la boleta/factura
    const resultado = parsearBoleta(textoCompleto);

    return NextResponse.json({
      textoDetectado: textoCompleto,
      items: resultado.items,
      totalDetectado: resultado.total,
      mensaje: resultado.items.length > 0
        ? `Se detectaron ${resultado.items.length} productos. Revisa antes de confirmar.`
        : 'Se detectó texto pero no se pudieron identificar productos. Revisa el texto detectado.'
    });

  } catch (error: any) {
    console.error('Error en OCR:', error);
    return NextResponse.json({ error: 'Error procesando la imagen' }, { status: 500 });
  }
}

interface ItemDetectado {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

function parsearBoleta(texto: string): { items: ItemDetectado[], total: number } {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const items: ItemDetectado[] = [];
  let totalDetectado = 0;

  // Patrones comunes en boletas/facturas peruanas
  // Patrón 1: "CANTIDAD DESCRIPCION PRECIO TOTAL"
  // Patrón 2: "DESCRIPCION x CANTIDAD TOTAL"
  // Patrón 3: "N DESCRIPCION P.UNIT IMPORTE"

  for (const linea of lineas) {
    // Buscar línea que tenga al menos un número al inicio y un número al final (precio)
    // Patrón: cantidad + texto + precio
    const match1 = linea.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+(\d+(?:\.\d{1,2})?)\s*$/);
    if (match1) {
      const cant = parseFloat(match1[1]);
      const desc = match1[2].trim();
      const precio = parseFloat(match1[3]);
      if (cant > 0 && cant < 1000 && precio > 0) {
        items.push({
          descripcion: desc,
          cantidad: cant,
          precioUnitario: precio / cant,
          subtotal: precio
        });
        continue;
      }
    }

    // Patrón: texto + cantidad x precio = subtotal
    const match2 = linea.match(/(.+?)\s+(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d{1,2})?)\s*=?\s*(\d+(?:\.\d{1,2})?)?/);
    if (match2) {
      const desc = match2[1].trim();
      const cant = parseFloat(match2[2]);
      const precioUnit = parseFloat(match2[3]);
      if (cant > 0 && cant < 1000 && precioUnit > 0) {
        items.push({
          descripcion: desc,
          cantidad: cant,
          precioUnitario: precioUnit,
          subtotal: cant * precioUnit
        });
        continue;
      }
    }

    // Patrón: precio al final de línea con texto antes
    const match3 = linea.match(/^(.+?)\s+S\/?\s*(\d+(?:\.\d{1,2})?)\s*$/i);
    if (match3) {
      const desc = match3[1].trim();
      const precio = parseFloat(match3[2]);
      // Ignorar líneas que son totales
      if (desc.toLowerCase().includes('total') || desc.toLowerCase().includes('subtotal') ||
          desc.toLowerCase().includes('igv') || desc.toLowerCase().includes('vuelto')) {
        if (desc.toLowerCase().includes('total') && !desc.toLowerCase().includes('subtotal')) {
          totalDetectado = precio;
        }
        continue;
      }
      if (precio > 0 && desc.length > 1) {
        items.push({
          descripcion: desc,
          cantidad: 1,
          precioUnitario: precio,
          subtotal: precio
        });
      }
    }

    // Detectar total
    const matchTotal = linea.match(/total\s*:?\s*S\/?\s*(\d+(?:\.\d{1,2})?)/i);
    if (matchTotal) {
      totalDetectado = parseFloat(matchTotal[1]);
    }
  }

  // Si no se detectó total, calcularlo de los items
  if (totalDetectado === 0 && items.length > 0) {
    totalDetectado = items.reduce((acc, item) => acc + item.subtotal, 0);
  }

  return { items, total: totalDetectado };
}
