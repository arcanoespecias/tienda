import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sales = await db.sale.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        items: true,
        client: { select: { id: true, name: true, emoji: true } },
      },
    })
    return NextResponse.json(sales)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, items, notas } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 })
    }

    let total = 0
    const saleItemsData = items.map((item: { name: string; qty: number; unitPrice: number }) => {
      const itemTotal = item.qty * item.unitPrice
      total += itemTotal
      return {
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: itemTotal,
      }
    })

    const sale = await db.sale.create({
      data: {
        clientId: clientId || null,
        total,
        notas: notas || null,
        items: { create: saleItemsData },
      },
      include: {
        items: true,
        client: { select: { id: true, name: true, emoji: true } },
      },
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}