import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tipo, cantidad, nota, usuario } = await request.json()

    if (!tipo || !cantidad || cantidad <= 0) {
      return NextResponse.json({ error: 'Tipo y cantidad válida requeridos' }, { status: 400 })
    }

    const spice = await db.spice.findUnique({ where: { id } })
    if (!spice) {
      return NextResponse.json({ error: 'Especia no encontrada' }, { status: 404 })
    }

    const newStock =
      tipo === 'ENTRADA'
        ? spice.stock + cantidad
        : tipo === 'SALIDA'
          ? spice.stock - cantidad
          : spice.stock

    await db.$transaction([
      db.spice.update({
        where: { id },
        data: { stock: newStock },
      }),
      db.stockMovement.create({
        data: {
          spiceId: id,
          tipo,
          cantidad,
          nota,
          usuario,
        },
      }),
    ])

    const updated = await db.spice.findUnique({ where: { id } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}