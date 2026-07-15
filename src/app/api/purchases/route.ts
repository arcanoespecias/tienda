import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const purchases = await db.purchase.findMany({
      orderBy: { fecha: 'desc' },
      include: { items: { include: { supply: true } } },
    })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supplier, notas, items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 })
    }

    const purchase = await db.$transaction(async (tx) => {
      let total = 0
      const purchaseItemsData = []

      for (const item of items) {
        const totalCost = item.quantity * item.unitCost
        total += totalCost
        purchaseItemsData.push({
          supplyId: item.supplyId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost,
        })
      }

      const purchase = await tx.purchase.create({
        data: {
          supplier: supplier || '',
          notas: notas || null,
          total,
          items: { create: purchaseItemsData },
        },
        include: { items: { include: { supply: true } } },
      })

      // Update supply stock for each item
      for (const item of items) {
        await tx.supply.update({
          where: { id: item.supplyId },
          data: { stock: { increment: item.quantity } },
        })
      }

      return purchase
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}