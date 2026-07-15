'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import type { User } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginView() {
  const { login, seed, fetchUsers, users, loading } = useApp()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pin, setPin] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        handleLogin(selectedUser!, newPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1))
  }

  const handleLogin = async (user: User, pinCode: string) => {
    const ok = await login(user.name, pinCode)
    if (!ok) {
      toast.error('PIN incorrecto')
      setPin('')
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seed()
      toast.success('Datos de ejemplo cargados')
    } catch {
      toast.error('Error al cargar datos')
    }
    setSeeding(false)
  }

  return (
    <div className="min-h-screen bg-amber-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-amber-200 tracking-wider">Arcano</h1>
          <p className="text-amber-400/80 text-sm font-light italic">Cómplice del Sabor</p>
        </div>

        {!selectedUser ? (
          /* User Selection */
          <div className="w-full space-y-3">
            {users.length === 0 && (
              <div className="text-center text-amber-300/60 text-sm py-8">
                No hay usuarios. Carga datos de ejemplo.
              </div>
            )}
            {users.map((u) => (
              <Card
                key={u.id}
                className="bg-amber-900/40 border-amber-700/30 cursor-pointer hover:bg-amber-900/60 hover:border-amber-600/50 transition-all"
                onClick={() => setSelectedUser(u)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-3xl">{u.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-100 font-medium truncate">{u.name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300'
                        : u.role === 'operador'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* PIN Pad */
          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2">
              <span className="text-4xl block">{selectedUser.emoji}</span>
              <p className="text-amber-100 font-medium">{selectedUser.name}</p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${
                      i < pin.length ? 'bg-amber-400 scale-110' : 'bg-amber-800/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) =>
                key === '' ? (
                  <div key="empty" />
                ) : key === '⌫' ? (
                  <Button
                    key="back"
                    variant="outline"
                    className="h-14 text-lg bg-amber-900/30 border-amber-700/30 text-amber-200 hover:bg-amber-900/50"
                    onClick={handleBackspace}
                  >
                    {key}
                  </Button>
                ) : (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-14 text-xl font-medium bg-amber-900/30 border-amber-700/30 text-amber-100 hover:bg-amber-800/50"
                    onClick={() => handlePinInput(key)}
                  >
                    {key}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full text-amber-500/60 hover:text-amber-300 hover:bg-transparent"
              onClick={() => {
                setSelectedUser(null)
                setPin('')
              }}
            >
              ← Volver
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-amber-300">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Ingresando...
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-amber-700/30 text-amber-400/80 hover:bg-amber-900/30 hover:text-amber-300"
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? 'Cargando...' : '✨ Cargar datos de ejemplo'}
        </Button>

        <p className="text-amber-700/40 text-xs text-center">
          Arcano — Sistema de gestión de especias
        </p>
      </div>
    </div>
  )
}