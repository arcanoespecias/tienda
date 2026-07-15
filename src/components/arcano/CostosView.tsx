'use client'

import { useEffect, useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { CostConfig } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

const defaults: CostConfig = {
  id: '', envChico: 1780, envGrande: 1750,
  pkgChico: 0, pkgGrande: 0, etiqueta: 0, mo: 0, otros: 0,
}

export default function CostosView() {
  const { fetchCosts, costs } = useApp()
  const [form, setForm] = useState<CostConfig>(defaults)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCosts()
  }, [fetchCosts])

  useEffect(() => {
    if (costs?.id) setForm(costs)
  }, [costs])

  const chicoTotal = (form.envChico || 0) + (form.pkgChico || 0) + (form.etiqueta || 0) + (form.mo || 0) + (form.otros || 0)
  const grandeTotal = (form.envGrande || 0) + (form.pkgGrande || 0) + (form.etiqueta || 0) + (form.mo || 0) + (form.otros || 0)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/costs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Costos guardados')
      fetchCosts()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Costos Fijos</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-500 text-white h-9">
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Envase Chico */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-300 text-base">📦 Envase Chico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Envase" value={form.envChico} onChange={(v) => setForm({ ...form, envChico: v })} />
            <Field label="Packaging" value={form.pkgChico} onChange={(v) => setForm({ ...form, pkgChico: v })} />
            <Field label="Etiqueta" value={form.etiqueta} onChange={(v) => setForm({ ...form, etiqueta: v })} />
            <Field label="Mano de obra" value={form.mo} onChange={(v) => setForm({ ...form, mo: v })} />
            <Field label="Otros" value={form.otros} onChange={(v) => setForm({ ...form, otros: v })} />
            <Separator className="bg-slate-700/30" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Total fijos/u</span>
              <span className="text-amber-300 font-bold text-lg">{fmt(chicoTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Envase Grande */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-300 text-base">📦 Envase Grande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Envase" value={form.envGrande} onChange={(v) => setForm({ ...form, envGrande: v })} />
            <Field label="Packaging" value={form.pkgGrande} onChange={(v) => setForm({ ...form, pkgGrande: v })} />
            <Field label="Etiqueta" value={form.etiqueta} onChange={(v) => setForm({ ...form, etiqueta: v })} />
            <Field label="Mano de obra" value={form.mo} onChange={(v) => setForm({ ...form, mo: v })} />
            <Field label="Otros" value={form.otros} onChange={(v) => setForm({ ...form, otros: v })} />
            <Separator className="bg-slate-700/30" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Total fijos/u</span>
              <span className="text-amber-300 font-bold text-lg">{fmt(grandeTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Nota: Etiqueta, mano de obra y otros se comparten entre ambos tamaños.
      </p>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-slate-400 text-sm shrink-0">{label}</Label>
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-slate-800 border-slate-700/50 text-slate-200 h-9 w-32 text-right"
      />
    </div>
  )
}