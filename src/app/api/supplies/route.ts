import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || ''
    const supplies = await db.supply.findMany({
      where: tipo ? { tipo } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(supplies)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tipo, name, supplier, price, unit, stock } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }
    const supply = await db.supply.create({
      data: {
        tipo: tipo || 'OTRO',
        name,
        supplier: supplier || '',
        price: price ?? 0,
        unit: unit || 'kg',
        stock: stock ?? 0,
      },
    })
    return NextResponse.json(supply, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}