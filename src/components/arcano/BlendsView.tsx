'use client'

import { useEffect, useState, useMemo } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { Blend, BlendIngredient } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, X, Beaker } from 'lucide-react'

interface IngForm { spiceId: string; grams: number; priceKg: number }

const emptyForm = {
  name: '', pesoChico: 0, pesoGrande: 0, precioChico: 0, precioGrande: 0, notas: '',
  ingredients: [] as IngForm[],
}

export default function BlendsView() {
  const { fetchBlends, fetchSpices, blends, spices } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Blend | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBlends()
    fetchSpices()
  }, [fetchBlends, fetchSpices])

  const getSpicePrice = (spiceId: string) => {
    const s = spices.find((sp) => sp.id === spiceId)
    return s?.priceKg ?? 0
  }

  const costoKg = useMemo(() => {
    return form.ingredients.reduce((sum, ing) => sum + (ing.grams / 1000) * ing.priceKg, 0)
  }, [form.ingredients])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, ingredients: [] })
    setOpen(true)
  }

  const openEdit = (b: Blend) => {
    setEditing(b)
    setForm({
      name: b.name,
      pesoChico: b.pesoChico,
      pesoGrande: b.pesoGrande,
      precioChico: b.precioChico,
      precioGrande: b.precioGrande,
      notas: b.notas || '',
      ingredients: b.ingredients.map((i) => ({ spiceId: i.spiceId, grams: i.grams, priceKg: i.priceKg })),
    })
    setOpen(true)
  }

  const addIngredient = () => {
    setForm({ ...form, ingredients: [...form.ingredients, { spiceId: '', grams: 0, priceKg: 0 }] })
  }

  const updateIng = (idx: number, field: keyof IngForm, value: string | number) => {
    const updated = [...form.ingredients]
    const ing = { ...updated[idx], [field]: value }
    if (field === 'spiceId') ing.priceKg = getSpicePrice(value as string)
    updated[idx] = ing as IngForm
    setForm({ ...form, ingredients: updated })
  }

  const removeIng = (idx: number) => {
    setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nombre requerido')
    setSaving(true)
    try {
      const url = editing ? `/api/blends/${editing.id}` : '/api/blends'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          pesoChico: form.pesoChico,
          pesoGrande: form.pesoGrande,
          precioChico: form.precioChico,
          precioGrande: form.precioGrande,
          notas: form.notas || null,
          ingredients: form.ingredients.filter((i) => i.spiceId),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Blend actualizado' : 'Blend creado')
      setOpen(false)
      fetchBlends()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este blend?')) return
    try {
      const res = await fetch(`/api/blends/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Blend eliminado')
      fetchBlends()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const getCapacity = (b: Blend) => {
    let minUnits = Infinity
    for (const ing of b.ingredients) {
      const spice = spices.find((s) => s.id === ing.spiceId)
      if (!spice) continue
      const unitsFromSpice = (spice.stock / ing.grams)
      if (unitsFromSpice < minUnits) minUnits = unitsFromSpice
    }
    return minUnits === Infinity ? 0 : Math.floor(minUnits)
  }

  const getBlendCostoKg = (b: Blend) => {
    return b.ingredients.reduce((sum, i) => sum + (i.grams / 1000) * i.priceKg, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Blends</h2>
        <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-500 text-white h-9">
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      {blends.length === 0 && (
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-8 text-center text-slate-500">No hay blends creados</CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {blends.map((b) => {
          const bCostoKg = getBlendCostoKg(b)
          const capacity = getCapacity(b)
          return (
            <Card key={b.id} className="bg-slate-900/80 border-slate-700/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-amber-200 text-base flex items-center gap-2">
                      <Beaker className="w-4 h-4 text-amber-500" />
                      {b.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={() => openEdit(b)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ingredients */}
                <div className="space-y-1">
                  {b.ingredients.map((ing) => (
                    <div key={ing.id} className="flex justify-between text-xs">
                      <span className="text-slate-400">{ing.spice?.name || '—'}</span>
                      <span className="text-slate-500">{Math.round(ing.grams)}g</span>
                    </div>
                  ))}
                </div>
                <Separator className="bg-slate-700/30" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <span className="text-slate-500">Chico ({Math.round(b.pesoChico)}g)</span>
                    <p className="text-amber-300 font-medium mt-0.5">{fmt(b.precioChico)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <span className="text-slate-500">Grande ({Math.round(b.pesoGrande)}g)</span>
                    <p className="text-amber-300 font-medium mt-0.5">{fmt(b.precioGrande)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Costo/kg blend:</span>
                  <span className="text-emerald-400">{fmt(bCostoKg)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Capacidad producción:</span>
                  <Badge className={`text-xs border-0 ${capacity <= 2 ? 'bg-red-600/20 text-red-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                    {capacity} unidades
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{editing ? 'Editar Blend' : 'Nuevo Blend'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-3">
            <div className="space-y-4">
              <div>
                <Label className="text-slate-400">Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-slate-400">Ingredientes (receta)</Label>
                  <Button variant="ghost" size="sm" onClick={addIngredient} className="text-amber-400 hover:text-amber-300 h-7">
                    <Plus className="w-3 h-3 mr-1" /> Agregar
                  </Button>
                </div>
                {form.ingredients.length === 0 && (
                  <p className="text-slate-600 text-xs">Sin ingredientes</p>
                )}
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-end mb-2">
                    <div className="flex-1 min-w-0">
                      <Select value={ing.spiceId} onValueChange={(v) => updateIng(idx, 'spiceId', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 text-sm">
                          <SelectValue placeholder="Especia..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700/50">
                          {spices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={ing.grams || ''}
                        onChange={(e) => updateIng(idx, 'grams', Number(e.target.value))}
                        placeholder="Gramos"
                        className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 text-sm"
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right">
                      {ing.grams ? `${(ing.grams / 10).toFixed(0)}/1kg` : ''}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400 shrink-0" onClick={() => removeIng(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {form.ingredients.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3 mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total receta:</span>
                      <span className="text-slate-300">{form.ingredients.reduce((s, i) => s + i.grams, 0)}g</span>
                    </div>
                    {form.ingredients.filter((i) => i.spiceId).map((ing, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-500">{spices.find((s) => s.id === ing.spiceId)?.name}</span>
                        <span className="text-slate-400">
                          {(ing.grams / 10).toFixed(1)}/1kg → {fmt((ing.grams / 1000) * ing.priceKg)}
                        </span>
                      </div>
                    ))}
                    <Separator className="bg-slate-700/30 my-1" />
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-amber-400">Costo por kg del blend:</span>
                      <span className="text-amber-300">{fmt(costoKg)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-700/30" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-400">Peso chico (g)</Label>
                  <Input type="number" value={form.pesoChico || ''} onChange={(e) => setForm({ ...form, pesoChico: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
                </div>
                <div>
                  <Label className="text-slate-400">Precio chico</Label>
                  <Input type="number" value={form.precioChico || ''} onChange={(e) => setForm({ ...form, precioChico: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
                </div>
                <div>
                  <Label className="text-slate-400">Peso grande (g)</Label>
                  <Input type="number" value={form.pesoGrande || ''} onChange={(e) => setForm({ ...form, pesoGrande: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
                </div>
                <div>
                  <Label className="text-slate-400">Precio grande</Label>
                  <Input type="number" value={form.precioGrande || ''} onChange={(e) => setForm({ ...form, precioGrande: Number(e.target.value) })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-slate-400">Notas</Label>
                <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" rows={2} />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}