import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULTS = {
  envChico: 1780,
  envGrande: 1750,
  pkgChico: 0,
  pkgGrande: 0,
  etiqueta: 0,
  mo: 0,
  otros: 0,
}

export async function GET() {
  try {
    const config = await db.costConfig.findFirst()
    if (config) {
      return NextResponse.json(config)
    }
    return NextResponse.json({ id: 'new', ...DEFAULTS })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const existing = await db.costConfig.findFirst()

    let config
    if (existing) {
      config = await db.costConfig.update({
        where: { id: existing.id },
        data,
      })
    } else {
      config = await db.costConfig.create({ data })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}