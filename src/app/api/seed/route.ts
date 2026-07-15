import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Clear existing data (order matters due to foreign keys)
    await db.saleItem.deleteMany()
    await db.sale.deleteMany()
    await db.purchaseItem.deleteMany()
    await db.purchase.deleteMany()
    await db.supply.deleteMany()
    await db.blendIngredient.deleteMany()
    await db.blend.deleteMany()
    await db.stockMovement.deleteMany()
    await db.spice.deleteMany()
    await db.costConfig.deleteMany()
    await db.user.deleteMany()

    // ── 1. Users ──
    const admin = await db.user.create({
      data: { name: 'Admin', pin: '1234', role: 'admin', emoji: '👑' },
    })
    await db.user.create({
      data: { name: 'Operador', pin: '0000', role: 'operador', emoji: '🌿' },
    })

    // ── 2. Spices (32) ──
    const spiceData = [
      { name: 'Ajo polvo', priceKg: 22000 },
      { name: 'Ajo escama', priceKg: 19000 },
      { name: 'Ajo grano', priceKg: 17000 },
      { name: 'Cebolla en polvo', priceKg: 18000 },
      { name: 'Cebolla en escamas', priceKg: 17500 },
      { name: 'Paprika', priceKg: 25000 },
      { name: 'Pimenton en escamas', priceKg: 23000 },
      { name: 'Paprika ahumada', priceKg: 35000 },
      { name: 'Oregano', priceKg: 45000 },
      { name: 'Albahaca', priceKg: 55000 },
      { name: 'Tomillo', priceKg: 48000 },
      { name: 'Laurel', priceKg: 65000 },
      { name: 'Romero', priceKg: 52000 },
      { name: 'Canela', priceKg: 75000 },
      { name: 'Canela en polvo', priceKg: 70000 },
      { name: 'Clavos', priceKg: 85000 },
      { name: 'Clavos polvo', priceKg: 90000 },
      { name: 'Jengibre', priceKg: 32000 },
      { name: 'Pimienta comun', priceKg: 28000 },
      { name: 'Pimienta negra', priceKg: 38000 },
      { name: 'Pimienta blanca', priceKg: 55000 },
      { name: 'Pimienta dulce', priceKg: 42000 },
      { name: 'Pimienta cayena', priceKg: 45000 },
      { name: 'Comino', priceKg: 30000 },
      { name: 'Hinojo', priceKg: 35000 },
      { name: 'Coreandro', priceKg: 28000 },
      { name: 'Semillas de Cilantro', priceKg: 26000 },
      { name: 'Fenogreco', priceKg: 33000 },
      { name: 'Semillas de Mostaza', priceKg: 24000 },
      { name: 'Cardamomo', priceKg: 95000 },
      { name: 'Curcuma', priceKg: 27000 },
      { name: 'Nuez moscada', priceKg: 80000 },
      { name: 'Anis estrellado', priceKg: 72000 },
    ]

    const createdSpices = []
    for (const s of spiceData) {
      const spice = await db.spice.create({
        data: { name: s.name, priceKg: s.priceKg, stock: 0, stockMin: 500 },
      })
      createdSpices.push(spice)
    }

    // Helper: get spice by name
    const spice = (name: string) => createdSpices.find((s) => s.name === name)!

    // ── 3. Blends (6) ──
    const blendsData: {
      name: string
      pesoChico: number
      pesoGrande: number
      precioChico: number
      precioGrande: number
      notas: string
      ingredients: { spiceName: string; grams: number }[]
    }[] = [
      {
        name: 'Berbere',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 4500,
        precioGrande: 15000,
        notas: 'Mezcla etíope clásica, picante y aromática',
        ingredients: [
          { spiceName: 'Paprika ahumada', grams: 200 },
          { spiceName: 'Pimienta cayena', grams: 120 },
          { spiceName: 'Comino', grams: 100 },
          { spiceName: 'Canela en polvo', grams: 60 },
          { spiceName: 'Clavos polvo', grams: 40 },
          { spiceName: 'Jengibre', grams: 80 },
          { spiceName: 'Coreandro', grams: 60 },
          { spiceName: 'Cardamomo', grams: 40 },
          { spiceName: 'Pimienta negra', grams: 80 },
          { spiceName: 'Curcuma', grams: 60 },
          { spiceName: 'Fenogreco', grams: 60 },
          { spiceName: 'Pimienta comun', grams: 100 },
        ],
      },
      {
        name: 'Cajun',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 3800,
        precioGrande: 12000,
        notas: 'Mezcla criolla de Louisiana, picante y sabrosa',
        ingredients: [
          { spiceName: 'Paprika', grams: 250 },
          { spiceName: 'Ajo polvo', grams: 150 },
          { spiceName: 'Cebolla en polvo', grams: 150 },
          { spiceName: 'Pimienta cayena', grams: 100 },
          { spiceName: 'Oregano', grams: 80 },
          { spiceName: 'Tomillo', grams: 60 },
          { spiceName: 'Pimienta negra', grams: 70 },
          { spiceName: 'Pimienta blanca', grams: 40 },
          { spiceName: 'Semillas de Cilantro', grams: 50 },
          { spiceName: 'Comino', grams: 50 },
        ],
      },
      {
        name: 'Creole',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 3600,
        precioGrande: 11500,
        notas: 'Mezcla criolla del Caribe, aromática y versátil',
        ingredients: [
          { spiceName: 'Paprika', grams: 230 },
          { spiceName: 'Ajo polvo', grams: 130 },
          { spiceName: 'Cebolla en polvo', grams: 130 },
          { spiceName: 'Oregano', grams: 100 },
          { spiceName: 'Tomillo', grams: 80 },
          { spiceName: 'Pimienta negra', grams: 80 },
          { spiceName: 'Pimienta cayena', grams: 50 },
          { spiceName: 'Semillas de Cilantro', grams: 60 },
          { spiceName: 'Pimienta dulce', grams: 60 },
          { spiceName: 'Laurel', grams: 80 },
        ],
      },
      {
        name: 'Jerk Jamaicano',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 4200,
        precioGrande: 13500,
        notas: 'Mezcla caribeña picante con hierbas y especias',
        ingredients: [
          { spiceName: 'Pimienta cayena', grams: 150 },
          { spiceName: 'Pimienta dulce', grams: 100 },
          { spiceName: 'Ajo polvo', grams: 100 },
          { spiceName: 'Cebolla en polvo', grams: 80 },
          { spiceName: 'Tomillo', grams: 100 },
          { spiceName: 'Oregano', grams: 80 },
          { spiceName: 'Canela en polvo', grams: 40 },
          { spiceName: 'Clavos polvo', grams: 30 },
          { spiceName: 'Pimienta negra', grams: 70 },
          { spiceName: 'Comino', grams: 50 },
          { spiceName: 'Semillas de Cilantro', grams: 50 },
          { spiceName: 'Jengibre', grams: 80 },
          { spiceName: 'Romero', grams: 70 },
        ],
      },
      {
        name: 'Piri Piri',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 4000,
        precioGrande: 12800,
        notas: 'Mezcla africana/portuguesa, intensamente picante',
        ingredients: [
          { spiceName: 'Pimienta cayena', grams: 300 },
          { spiceName: 'Ajo polvo', grams: 150 },
          { spiceName: 'Paprika', grams: 150 },
          { spiceName: 'Oregano', grams: 100 },
          { spiceName: 'Pimienta negra', grams: 80 },
          { spiceName: 'Cebolla en polvo', grams: 70 },
          { spiceName: 'Jengibre', grams: 50 },
          { spiceName: 'Romero', grams: 50 },
          { spiceName: 'Tomillo', grams: 50 },
        ],
      },
      {
        name: 'Vegetales Asados',
        pesoChico: 50,
        pesoGrande: 200,
        precioChico: 3200,
        precioGrande: 10000,
        notas: 'Mezcla para vegetales asados, ahumada y dulce',
        ingredients: [
          { spiceName: 'Ajo polvo', grams: 200 },
          { spiceName: 'Cebolla en polvo', grams: 200 },
          { spiceName: 'Paprika ahumada', grams: 180 },
          { spiceName: 'Paprika', grams: 120 },
          { spiceName: 'Comino', grams: 60 },
          { spiceName: 'Pimienta negra', grams: 60 },
          { spiceName: 'Oregano', grams: 50 },
          { spiceName: 'Tomillo', grams: 50 },
          { spiceName: 'Curcuma', grams: 40 },
          { spiceName: 'Semillas de Mostaza', grams: 40 },
        ],
      },
    ]

    for (const b of blendsData) {
      const ingredients = b.ingredients.map((i) => {
        const s = spice(i.spiceName)
        return {
          spiceId: s.id,
          grams: i.grams,
          priceKg: s.priceKg,
        }
      })

      await db.blend.create({
        data: {
          name: b.name,
          pesoChico: b.pesoChico,
          pesoGrande: b.pesoGrande,
          precioChico: b.precioChico,
          precioGrande: b.precioGrande,
          notas: b.notas,
          ingredients: { create: ingredients },
        },
      })
    }

    // ── 4. CostConfig ──
    await db.costConfig.create({
      data: {
        envChico: 1780,
        envGrande: 1750,
        pkgChico: 0,
        pkgGrande: 0,
        etiqueta: 0,
        mo: 0,
        otros: 0,
      },
    })

    return NextResponse.json({ ok: true, message: 'Seed completo' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}