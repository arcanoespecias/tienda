import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, role: true, emoji: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, pin, role, emoji } = await request.json()
    if (!name || !pin) {
      return NextResponse.json({ error: 'Nombre y PIN requeridos' }, { status: 400 })
    }
    const user = await db.user.create({
      data: { name, pin, role: role || 'operador', emoji: emoji || '👤' },
    })
    const { pin: _, ...userWithoutPin } = user
    return NextResponse.json(userWithoutPin, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}