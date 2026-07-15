'use client'

import { useEffect, useMemo } from 'react'
import { useApp, fmt } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DashboardView() {
  const { fetchSales, fetchSpices, sales, spices, blends } = useApp()

  useEffect(() => {
    fetchSales()
    fetchSpices()
  }, [fetchSales, fetchSpices])

  const today = new Date().toISOString().slice(0, 10)
  const todayStr = new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

  const salesToday = useMemo(() => sales.filter((s) => s.fecha && s.fecha.slice(0, 10) === today), [sales, today])
  const totalToday = salesToday.reduce((s, v) => s + v.total, 0)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = sales
    .filter((s) => s.fecha && s.fecha.slice(0, 7) === thisMonth && s.estado !== 'cancelada')
    .reduce((s, v) => s + v.total, 0)

  const lowStock = useMemo(() => spices.filter((s) => s.stock <= s.stockMin), [spices])

  // 7-day bar chart data
  const last7Days = useMemo(() => {
    const days: { label: string; total: number; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
      const daySales = sales.filter((s) => s.fecha && s.fecha.slice(0, 10) === key && s.estado !== 'cancelada')
      days.push({
        label,
        total: daySales.reduce((s, v) => s + v.total, 0),
        count: daySales.length,
      })
    }
    return days
  }, [sales])

  const maxDayTotal = Math.max(...last7Days.map((d) => d.total), 1)

  const recentSales = sales.slice(0, 5)

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>()
    for (const sale of sales) {
      if (sale.estado === 'cancelada') continue
      for (const item of sale.items) {
        const existing = map.get(item.name)
        if (existing) {
          existing.qty += item.qty
          existing.total += item.total
        } else {
          map.set(item.name, { name: item.name, qty: item.qty, total: item.total })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [sales])

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Ventas hoy</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{salesToday.length}</p>
            <p className="text-slate-400 text-sm">{fmt(totalToday)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Ingresos mes</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(monthlyIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Especias</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{spices.length}</p>
            <p className="text-slate-400 text-sm">{blends.length} blends</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Stock bajo</p>
            <p className={`text-2xl font-bold mt-1 ${lowStock.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {lowStock.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 7-day chart */}
        <Card className="bg-slate-900/80 border-slate-700/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-200 text-base">Ventas últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end gap-2 h-40">
              {last7Days.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">{d.count > 0 ? fmt(d.total) : ''}</span>
                  <div
                    className="w-full bg-amber-600/80 hover:bg-amber-500 transition-colors rounded-t-sm min-h-[4px]"
                    style={{ height: `${Math.max((d.total / maxDayTotal) * 100, 4)}%` }}
                  />
                  <span className="text-xs text-slate-500 truncate w-full text-center">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-300 text-base">⚠️ Stock bajo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {lowStock.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin alertas</p>
            ) : (
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {lowStock.slice(0, 8).map((s) => (
                    <div key={s.id} className="flex justify-between items-center">
                      <span className="text-sm text-slate-300 truncate">{s.name}</span>
                      <Badge variant="destructive" className="text-xs shrink-0">
                        {Math.round(s.stock)}g / {Math.round(s.stockMin)}g
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-200 text-base">Ventas recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {recentSales.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin ventas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Fecha</TableHead>
                    <TableHead className="text-slate-400 text-xs">Cliente</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((s) => (
                    <TableRow key={s.id} className="border-slate-700/30">
                      <TableCell className="text-slate-300 text-xs py-2">
                        {s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '-'}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs py-2">
                        {s.client?.emoji} {s.client?.name || 'Directo'}
                      </TableCell>
                      <TableCell className="text-amber-300 text-xs text-right py-2 font-medium">{fmt(s.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-200 text-base">🏆 Más vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {topProducts.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-amber-500 font-bold w-5 text-right">{i + 1}</span>
                    <span className="flex-1 text-sm text-slate-300 truncate">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.qty} u</span>
                    <span className="text-sm text-amber-300 font-medium">{fmt(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}