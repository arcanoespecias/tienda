'use client'

import { useState } from 'react'
import { useApp, fmt } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Plus, Minus, X, ShoppingBag } from 'lucide-react'

export default function CartView() {
  const { user, cart, updateCartQty, removeFromCart, clearCart, cartTotal, setView } = useApp()
  const [confirming, setConfirming] = useState(false)

  const total = cartTotal()

  const handleConfirm = async () => {
    if (cart.length === 0) return
    setConfirming(true)
    try {
      const items = cart.map((c) => ({ name: `${c.name} (${c.size})`, qty: c.qty, unitPrice: c.price }))
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user?.id || null, items, notas: 'Pedido desde carrito' }),
      })
      if (!res.ok) throw new Error()
      toast.success('¡Pedido confirmado! 🎉')
      clearCart()
      setView('mis-pedidos')
    } catch {
      toast.error('Error al crear pedido')
    }
    setConfirming(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-amber-200">Tu Carrito</h2>
      </div>

      {cart.length === 0 ? (
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Tu carrito está vacío</p>
            <Button variant="outline" className="mt-4 border-amber-700/50 text-amber-400 hover:bg-amber-900/30" onClick={() => setView('storefront')}>
              Ver catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <div className="divide-y divide-slate-700/30">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium text-sm">{item.name}</p>
                        <p className="text-slate-500 text-xs capitalize">{item.size} — {fmt(item.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800" onClick={() => updateCartQty(item.productId, item.qty - 1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-slate-200 font-medium w-8 text-center">{item.qty}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800" onClick={() => updateCartQty(item.productId, item.qty + 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <span className="text-amber-300 font-medium w-20 text-right">{fmt(item.price * item.qty)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400 shrink-0" onClick={() => removeFromCart(item.productId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="text-amber-300 font-bold text-2xl">{fmt(total)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-slate-700/50 text-slate-400 hover:text-slate-200" onClick={() => { clearCart(); toast.success('Carrito vaciado') }}>
                  Vaciar
                </Button>
                <Button onClick={handleConfirm} disabled={confirming} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white h-11">
                  {confirming ? 'Confirmando...' : '✅ Confirmar pedido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}