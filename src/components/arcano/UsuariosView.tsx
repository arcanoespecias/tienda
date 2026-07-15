'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import type { User } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'

const emojis = ['👤', '👩‍💼', '👨‍🍳', '🧑‍🌾', '🧑‍🔧', '👩', '👨', '🧑', '🧙', '🧛', '🦊', '🐱', '🐶', '🦁', '🐻', '🐼', '🦄', '🐲', '⭐', '🔥', '💎', '🌿', '🌶️', '🧄', '🫚']

export default function UsuariosView() {
  const { fetchUsers, users } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', pin: '', role: 'operador', emoji: '👤' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const canDelete = users.length > 1

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', pin: '', role: 'operador', emoji: '👤' })
    setOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ name: u.name, pin: '', role: u.role, emoji: u.emoji })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nombre requerido')
    if (!editing && !form.pin) return toast.error('PIN requerido')
    if (!editing && form.pin.length !== 4) return toast.error('PIN debe ser 4 dígitos')
    setSaving(true)
    try {
      if (editing) {
        const data: Record<string, string> = { name: form.name, role: form.role, emoji: form.emoji }
        if (form.pin) data.pin = form.pin
        const res = await fetch(`/api/users/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        toast.success('Usuario actualizado')
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('Usuario creado')
      }
      setOpen(false)
      fetchUsers()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!canDelete) return toast.error('Debe haber al menos un usuario')
    if (!confirm('¿Eliminar usuario?')) return
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' })
      toast.success('Eliminado')
      fetchUsers()
    } catch {
      toast.error('Error')
    }
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-amber-500/20 text-amber-300',
      operador: 'bg-emerald-500/20 text-emerald-300',
      cliente: 'bg-sky-500/20 text-sky-300',
    }
    return styles[role] || ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-200">Usuarios</h2>
        <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-500 text-white h-9">
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Emoji</TableHead>
                <TableHead className="text-slate-400 text-xs">Nombre</TableHead>
                <TableHead className="text-slate-400 text-xs">Rol</TableHead>
                <TableHead className="text-slate-400 text-xs">PIN</TableHead>
                <TableHead className="text-slate-400 text-xs text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">Sin usuarios</TableCell></TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id} className="border-slate-700/30">
                  <TableCell className="text-2xl py-2.5">{u.emoji}</TableCell>
                  <TableCell className="text-slate-200 font-medium py-2.5">{u.name}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge className={`text-xs border-0 ${roleBadge(u.role)}`}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono tracking-widest py-2.5">••••</TableCell>
                  <TableCell className="text-right py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={() => openEdit(u)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${canDelete ? 'text-red-400/60 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-700 cursor-not-allowed'}`}
                        onClick={() => handleDelete(u.id)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-200">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-400">Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`text-2xl p-1 rounded-lg transition-all ${form.emoji === e ? 'bg-amber-600/30 ring-2 ring-amber-500' : 'hover:bg-slate-800'}`}
                    onClick={() => setForm({ ...form, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">PIN (4 dígitos){editing && ' — dejar vacío para no cambiar'}</Label>
              <Input
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                maxLength={4}
                className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1 font-mono tracking-widest text-center text-lg"
              />
            </div>
            <div>
              <Label className="text-slate-400">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700/50 text-slate-200 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700/50">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
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