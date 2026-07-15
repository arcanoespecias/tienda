import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const blends = await db.blend.findMany({
      orderBy: { name: 'asc' },
      include: {
        ingredients: {
          include: {
            spice: { select: { id: true, name: true } },
          },
        },
      },
    })
    return NextResponse.json(blends)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, pesoChico, pesoGrande, precioChico, precioGrande, notas, ingredients } =
      await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const blend = await db.blend.create({
      data: {
        name,
        pesoChico: pesoChico ?? 0,
        pesoGrande: pesoGrande ?? 0,
        precioChico: precioChico ?? 0,
        precioGrande: precioGrande ?? 0,
        notas: notas || null,
        ingredients: {
          create: (ingredients || []).map((i: { spiceId: string; grams: number; priceKg: number }) => ({
            spiceId: i.spiceId,
            grams: i.grams,
            priceKg: i.priceKg,
          })),
        },
      },
      include: {
        ingredients: { include: { spice: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json(blend, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}