import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, pesoChico, pesoGrande, precioChico, precioGrande, notas, ingredients } =
      await request.json()

    const blend = await db.$transaction(async (tx) => {
      // Delete existing ingredients
      await tx.blendIngredient.deleteMany({ where: { blendId: id } })

      // Update blend and create new ingredients
      return tx.blend.update({
        where: { id },
        data: {
          name: name ?? undefined,
          pesoChico: pesoChico ?? undefined,
          pesoGrande: pesoGrande ?? undefined,
          precioChico: precioChico ?? undefined,
          precioGrande: precioGrande ?? undefined,
          notas: notas !== undefined ? notas : undefined,
          ingredients: {
            create: (ingredients || []).map(
              (i: { spiceId: string; grams: number; priceKg: number }) => ({
                spiceId: i.spiceId,
                grams: i.grams,
                priceKg: i.priceKg,
              })
            ),
          },
        },
        include: {
          ingredients: { include: { spice: { select: { id: true, name: true } } } },
        },
      })
    })

    return NextResponse.json(blend)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.blend.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}