'use client'

import { useEffect, useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { Spice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pencil, Trash2, Package, Plus } from 'lucide-react'

const emptySpice = { name: '', priceKg: 0, stock: 0, stockMin: 500 }

export default function EspeciasView() {
  const { fetchSpices, spices } = useApp()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Spice | null>(null)
  const [form, setForm] = useState(emptySpice)
  const [saving, setSaving] = useState(false)

  // Stock dialog
  const [stockOpen, setStockOpen] = useState(false)
  const [stockSpice, setStockSpice] = useState<Spice | null>(null)
  const [stockTipo, setStockTipo] = useState('ENTRADA')
  const [stockCant, setStockCant] = useState('')
  const [stockNota, setStockNota] = useState('')
  const [savingStock, setSavingStock] = useState(false)

  useEffect(() => {
    fetchSpices()
  }, [fetchSpices])

  const filtered = spices.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  const openNew = () => {
    setEditing(null)
    setForm(emptySpice)
    setDialogOpen(true)
  }

  const openEdit = (spice: Spice) => {
    setEditing(spice)
    setForm({ name: spice.name, priceKg: spice.priceKg, stock: spice.stock, stockMin: spice.stockMin })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nombre requerido')
    setSaving(true)
    try {
      const url = editing ? `/api/spices/${editing.id}` : '/api/spices'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Especia actualizada' : 'Especia creada')
      setDialogOpen(false)
      fetchSpices()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta especia?')) return
    try {
      const res = await fetch(`/api/spices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Especia eliminada')
      fetchSpices()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const openStock = (spice: Spice) => {
    setStockSpice(spice)
    setStockTipo('ENTRADA')
    setStockCant('')
    setStockNota('')
    setStockOpen(true)
  }

  const handleStockSave = async () => {
    if (!stockSpice || !stockCant || Number(stockCant) <= 0) return toast.error('Cantidad válida requerida')
    setSavingStock(true)
    try {
      const res = await fetch(`/api/spices/${stockSpice.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: stockTipo, cantidad: Number(stockCant), nota: stockNota }),
      })
      if (!res.ok) throw new Error()
      toast.success('Stock actualizado')
      setStockOpen(false)
      fetchSpices()
    } catch {
      toast.error('Error al actualizar stock')
    }
    setSavingStock(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Especias</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800/60 border-slate-700/50 text-slate-200 placeholder:text-slate-500 h-9"
          />
          <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-500 text-white shrink-0 h-9">
            <Plus className="w-4 h-4 mr-1" /> Nueva
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Nombre</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">$/kg</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right hidden sm:table-cell">$/100g</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Stock</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right hidden md:table-cell">Mín</TableHead>
                  <TableHead className="text-slate-400 text-xs">Estado</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No hay especias
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-slate-700/30">
                    <TableCell className="text-slate-200 font-medium py-2.5">{s.name}</TableCell>
                    <TableCell className="text-slate-300 text-right py-2.5">{fmt(s.priceKg)}</TableCell>
                    <TableCell className="text-slate-300 text-right py-2.5 hidden sm:table-cell">{fmt(s.priceKg / 10)}</TableCell>
                    <TableCell className="text-right py-2.5">
                      <span className={s.stock <= s.stockMin ? 'text-red-400 font-medium' : 'text-slate-300'}>
                        {Math.round(s.stock)}g
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-right hidden md:table-cell">{Math.round(s.stockMin)}g</TableCell>
                    <TableCell className="py-2.5">
                      {s.stock <= s.stockMin ? (
                        <Badge variant="destructive" className="text-xs">Bajo</Badge>
                      ) : (
                        <Badge className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-0">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={() => openStock(s)}>
                          <Package className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800" onClick={() => openEdit(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-4 h-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{editing ? 'Editar Especia' : 'Nueva Especia'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-400">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-400">$/kg</Label>
                <Input type="number" value={form.priceKg} onChange={(e) => setForm({ ...form, priceKg: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Stock (g)</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Mín (g)</Label>
                <Input type="number" value={form.stockMin} onChange={(e) => setForm({ ...form, stockMin: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Dialog */}
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-200">📦 Movimiento de Stock — {stockSpice?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-400">Tipo</Label>
              <Select value={stockTipo} onValueChange={setStockTipo}>
                <SelectTrigger className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700/50">
                  <SelectItem value="ENTRADA">📥 Entrada</SelectItem>
                  <SelectItem value="SALIDA">📤 Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Cantidad (g)</Label>
              <Input type="number" value={stockCant} onChange={(e) => setStockCant(e.target.value)} placeholder="0" className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Nota (opcional)</Label>
              <Textarea value={stockNota} onChange={(e) => setStockNota(e.target.value)} placeholder="Ej: Compra proveedor X" className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" rows={2} />
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
              Stock actual: <span className="text-amber-300 font-medium">{stockSpice ? Math.round(stockSpice.stock) + 'g' : '-'}</span>
            </div>
            <Button onClick={handleStockSave} disabled={savingStock} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
              {savingStock ? 'Guardando...' : 'Registrar movimiento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}