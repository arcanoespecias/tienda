'use client'

import { useEffect, useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const estadoStyles: Record<string, string> = {
  pendiente: 'bg-yellow-600/20 text-yellow-300',
  completada: 'bg-emerald-600/20 text-emerald-300',
  entregada: 'bg-sky-600/20 text-sky-300',
  cancelada: 'bg-red-600/20 text-red-300',
}

export default function MisPedidosView() {
  const { user, fetchSales, sales, setView } = useApp()

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const mySales = sales
    .filter((s) => s.clientId === user?.id || s.client?.id === user?.id)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Mis Pedidos</h2>
        <button onClick={() => setView('storefront')} className="text-sm text-amber-400 hover:text-amber-300">
          ← Volver al catálogo
        </button>
      </div>

      {mySales.length === 0 ? (
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-8 text-center text-slate-500">
            No tenés pedidos aún.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mySales.map((s) => (
            <Card key={s.id} className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-300 text-sm">
                      {s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                  <Badge className={`text-xs border-0 ${estadoStyles[s.estado] || ''}`}>
                    {s.estado}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {s.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.name} × {item.qty}</span>
                      <span className="text-slate-200">{fmt(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-slate-700/30 pt-2">
                  <span className="text-slate-400 text-sm">Total</span>
                  <span className="text-amber-300 font-bold">{fmt(s.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}