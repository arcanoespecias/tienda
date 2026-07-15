'use client'

import { useEffect, useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { Sale } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Eye, Trash2 } from 'lucide-react'

const estados = ['pendiente', 'completada', 'entregada', 'cancelada'] as const

const estadoStyles: Record<string, string> = {
  pendiente: 'bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30',
  completada: 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30',
  entregada: 'bg-sky-600/20 text-sky-300 hover:bg-sky-600/30',
  cancelada: 'bg-red-600/20 text-red-300 hover:bg-red-600/30',
}

const estadoDot: Record<string, string> = {
  pendiente: 'bg-yellow-400',
  completada: 'bg-emerald-400',
  entregada: 'bg-sky-400',
  cancelada: 'bg-red-400',
}

export default function VentasView() {
  const { fetchSales, sales } = useApp()
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Sale | null>(null)

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const changeEstado = async (sale: Sale, estado: string) => {
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) throw new Error()
      toast.success('Estado actualizado')
      fetchSales()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar venta?')) return
    try {
      await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      toast.success('Eliminada')
      fetchSales()
    } catch {
      toast.error('Error')
    }
  }

  const openDetail = (sale: Sale) => {
    setSelected(sale)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Ventas</h2>
        <span className="text-sm text-slate-500">{sales.length} ventas</span>
      </div>

      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Fecha</TableHead>
                  <TableHead className="text-slate-400 text-xs">Cliente</TableHead>
                  <TableHead className="text-slate-400 text-xs hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Total</TableHead>
                  <TableHead className="text-slate-400 text-xs">Estado</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Sin ventas</TableCell></TableRow>
                )}
                {sales.map((s) => (
                  <TableRow key={s.id} className="border-slate-700/30">
                    <TableCell className="text-slate-300 text-xs py-2.5">
                      {s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-200 text-xs py-2.5">
                      {s.client?.emoji} {s.client?.name || 'Directo'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs py-2.5 hidden md:table-cell">
                      {s.items.length} item{Math.abs(s.items.length) !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-amber-300 text-xs text-right font-medium py-2.5">{fmt(s.total)}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge className={`text-xs border-0 cursor-pointer ${estadoStyles[s.estado] || ''}`} onClick={() => {
                        const idx = estados.indexOf(s.estado as typeof estados[number])
                        const next = estados[(idx + 1) % estados.length]
                        changeEstado(s, next)
                      }}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${estadoDot[s.estado] || ''}`} />
                        {s.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={() => openDetail(s)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-200">Detalle de Venta</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fecha</span>
                <span className="text-slate-200">{selected.fecha ? new Date(selected.fecha).toLocaleString('es-AR') : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cliente</span>
                <span className="text-slate-200">{selected.client?.emoji} {selected.client?.name || 'Directo'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Estado</span>
                <div className="flex gap-1">
                  {estados.map((e) => (
                    <Badge
                      key={e}
                      className={`text-xs border-0 cursor-pointer ${selected.estado === e ? estadoStyles[e] : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                      onClick={() => {
                        changeEstado(selected, e)
                        setSelected({ ...selected, estado: e })
                      }}
                    >
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700/30 pt-3 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Items</p>
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.name} × {item.qty}</span>
                    <span className="text-slate-200">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-700/30 pt-3">
                <span className="text-slate-300 font-medium">Total</span>
                <span className="text-amber-300 font-bold text-xl">{fmt(selected.total)}</span>
              </div>

              {selected.notas && (
                <p className="text-xs text-slate-500 italic">📝 {selected.notas}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}