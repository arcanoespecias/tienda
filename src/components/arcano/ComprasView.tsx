'use client'

import { useEffect, useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { Supply, Purchase, PurchaseItem } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

// ===== SUPPLIES TAB =====
function SuppliesTab() {
  const { fetchSupplies, supplies } = useApp()
  const [tipo, setTipo] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState({ tipo: 'ESPECIA', name: '', supplier: '', price: 0, unit: 'kg', stock: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSupplies(tipo || undefined)
  }, [fetchSupplies, tipo])

  const filtered = tipo ? supplies.filter((s) => s.tipo === tipo) : supplies

  const openNew = () => {
    setEditing(null)
    setForm({ tipo: tipo || 'ESPECIA', name: '', supplier: '', price: 0, unit: 'kg', stock: 0 })
    setOpen(true)
  }

  const openEdit = (s: Supply) => {
    setEditing(s)
    setForm({ tipo: s.tipo, name: s.name, supplier: s.supplier, price: s.price, unit: s.unit, stock: s.stock })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nombre requerido')
    setSaving(true)
    try {
      const url = editing ? `/api/supplies/${editing.id}` : '/api/supplies'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Insumo actualizado' : 'Insumo creado')
      setOpen(false)
      fetchSupplies(tipo || undefined)
    } catch { toast.error('Error') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar?')) return
    try {
      await fetch(`/api/supplies/${id}`, { method: 'DELETE' })
      toast.success('Eliminado')
      fetchSupplies(tipo || undefined)
    } catch { toast.error('Error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['', 'ESPECIA', 'ENVASE', 'ETIQUETA', 'PACKAGING'].map((t) => (
            <Button
              key={t}
              variant={tipo === t ? 'default' : 'outline'}
              size="sm"
              className={`h-8 text-xs ${tipo === t ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'border-slate-700/50 text-slate-400 hover:text-slate-200'}`}
              onClick={() => setTipo(t)}
            >
              {t || 'Todos'}
            </Button>
          ))}
        </div>
        <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-500 text-white h-8 text-sm shrink-0">
          <Plus className="w-3 h-3 mr-1" /> Nuevo
        </Button>
      </div>

      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Nombre</TableHead>
                  <TableHead className="text-slate-400 text-xs">Tipo</TableHead>
                  <TableHead className="text-slate-400 text-xs hidden sm:table-cell">Proveedor</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Precio</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Stock</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Sin insumos</TableCell></TableRow>
                )}
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-slate-700/30">
                    <TableCell className="text-slate-200 py-2.5">{s.name}</TableCell>
                    <TableCell className="py-2.5"><Badge className="text-xs bg-slate-700/50 text-slate-300 border-0">{s.tipo}</Badge></TableCell>
                    <TableCell className="text-slate-400 text-xs py-2.5 hidden sm:table-cell">{s.supplier}</TableCell>
                    <TableCell className="text-slate-300 text-right py-2.5">{fmt(s.price)}/{s.unit}</TableCell>
                    <TableCell className="text-slate-300 text-right py-2.5">{s.stock}</TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={() => openEdit(s)}>
                          <Pencil className="w-3.5 h-3.5" />
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

      {/* Supply Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{editing ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700/50">
                  {['ESPECIA', 'ENVASE', 'ETIQUETA', 'PACKAGING', 'OTRO'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-400">Precio</Label>
                <Input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Unidad</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Stock</Label>
                <Input type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Proveedor</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== PURCHASES TAB =====
interface PurchaseItemForm { supplyId: string; quantity: number; unitCost: number }

function PurchasesTab() {
  const { fetchPurchases, fetchSupplies, purchases, supplies } = useApp()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<PurchaseItemForm[]>([])

  useEffect(() => {
    fetchPurchases()
    fetchSupplies()
  }, [fetchPurchases, fetchSupplies])

  const addItem = () => setItems([...items, { supplyId: '', quantity: 0, unitCost: 0 }])
  const updateItem = (idx: number, field: keyof PurchaseItemForm, value: string | number) => {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const handleCreate = async () => {
    const validItems = items.filter((i) => i.supplyId && i.quantity > 0)
    if (validItems.length === 0) return toast.error('Agregá al menos un item')
    setSaving(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier, notas, items: validItems }),
      })
      if (!res.ok) throw new Error()
      toast.success('Compra registrada')
      setOpen(false)
      setSupplier('')
      setNotas('')
      setItems([])
      fetchPurchases()
      fetchSupplies()
    } catch { toast.error('Error') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar compra?')) return
    try {
      await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
      toast.success('Eliminada')
      fetchPurchases()
    } catch { toast.error('Error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-base font-medium text-amber-200">Compras</h3>
        <Button onClick={() => { setItems([]); setSupplier(''); setNotas(''); setOpen(true) }} className="bg-amber-600 hover:bg-amber-500 text-white h-8 text-sm">
          <Plus className="w-3 h-3 mr-1" /> Nueva Compra
        </Button>
      </div>

      <div className="space-y-2">
        {purchases.length === 0 && <Card className="bg-slate-900/80 border-slate-700/50"><CardContent className="p-6 text-center text-slate-500 text-sm">Sin compras</CardContent></Card>}
        {purchases.map((p) => (
          <Card key={p.id} className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded === p.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{p.supplier || 'Sin proveedor'}</p>
                    <p className="text-slate-500 text-xs">{p.fecha ? new Date(p.fecha).toLocaleDateString('es-AR') : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-300 font-medium text-sm">{fmt(p.total)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expanded === p.id && (
                <div className="mt-3 pl-7 space-y-1 border-t border-slate-700/30 pt-2">
                  {p.items.map((item: PurchaseItem) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-slate-400">{item.supply?.name || '—'} × {item.quantity}</span>
                      <span className="text-slate-300">{fmt(item.totalCost)}</span>
                    </div>
                  ))}
                  {p.notas && <p className="text-xs text-slate-500 italic mt-1">📝 {p.notas}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Purchase Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-amber-200">Nueva Compra</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="space-y-4">
              <div>
                <Label className="text-slate-400">Proveedor</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Notas</Label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" rows={2} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-slate-400">Items</Label>
                  <Button variant="ghost" size="sm" onClick={addItem} className="text-amber-400 hover:text-amber-300 h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Agregar
                  </Button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end mb-2">
                    <div className="flex-1 min-w-0">
                      <Select value={item.supplyId} onValueChange={(v) => updateItem(idx, 'supplyId', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 text-sm">
                          <SelectValue placeholder="Insumo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700/50">
                          {supplies.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({fmt(s.price)}/{s.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      placeholder="Cant"
                      className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 w-20 text-sm"
                    />
                    <Input
                      type="number"
                      value={item.unitCost || ''}
                      onChange={(e) => updateItem(idx, 'unitCost', Number(e.target.value))}
                      placeholder="$ unit"
                      className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 w-24 text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400 shrink-0" onClick={() => removeItem(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {items.length > 0 && (
                  <p className="text-xs text-amber-300 text-right mt-1">
                    Total: {fmt(items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
                  </p>
                )}
              </div>

              <Button onClick={handleCreate} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
                {saving ? 'Creando...' : 'Registrar Compra'}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== MAIN =====
export default function ComprasView() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-amber-200">Compras</h2>
      <Tabs defaultValue="insumos" className="w-full">
        <TabsList className="bg-slate-800/60 border border-slate-700/50">
          <TabsTrigger value="insumos" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400">
            Insumos
          </TabsTrigger>
          <TabsTrigger value="compras" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400">
            Compras
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insumos" className="mt-4">
          <SuppliesTab />
        </TabsContent>
        <TabsContent value="compras" className="mt-4">
          <PurchasesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}