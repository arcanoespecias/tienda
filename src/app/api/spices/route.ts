import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const spices = await db.spice.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(spices)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, priceKg, stock, stockMin } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }
    const spice = await db.spice.create({
      data: {
        name,
        priceKg: priceKg ?? 0,
        stock: stock ?? 0,
        stockMin: stockMin ?? 500,
      },
    })
    return NextResponse.json(spice, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}