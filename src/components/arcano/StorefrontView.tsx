'use client'

import { useEffect, useState, useMemo } from 'react'
import { useApp, fmt } from '@/lib/store'
import type { CartItem } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Minus, X, Package, Beaker, ShoppingBag } from 'lucide-react'

export default function StorefrontView() {
  const { fetchSpices, fetchBlends, fetchSales, spices, blends, user, cart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal, setView } = useApp()
  const [sizeDialog, setSizeDialog] = useState<{ open: boolean; name: string; productId: string; type: 'specie' | 'blend'; precioChico: number; precioGrande: number } | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetchSpices()
    fetchBlends()
    fetchSales()
  }, [fetchSpices, fetchBlends, fetchSales])

  const total = cartTotal()

  const handleAddToCart = (productId: string, name: string, type: 'specie' | 'blend', size: 'chico' | 'grande', price: number) => {
    const item: CartItem = { productId, name, type, size, price, qty: 1 }
    addToCart(item)
    setSizeDialog(null)
    toast.success(`Agregado al carrito`)
  }

  const handleConfirm = async () => {
    if (cart.length === 0) return
    setConfirming(true)
    try {
      const items = cart.map((c) => ({ name: `${c.name} (${c.size})`, qty: c.qty, unitPrice: c.price }))
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user?.id || null, items, notas: 'Pedido desde vitrina' }),
      })
      if (!res.ok) throw new Error()
      toast.success('¡Pedido confirmado! 🎉')
      clearCart()
      setCartOpen(false)
      fetchSales()
    } catch {
      toast.error('Error al crear pedido')
    }
    setConfirming(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-amber-200">Catálogo</h2>
        <p className="text-slate-400 text-sm mt-1">Elegí tus especias y blends favoritos</p>
      </div>

      {/* Blends Section */}
      {blends.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <Beaker className="w-4 h-4" /> Blends
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {blends.map((b) => (
              <Card key={b.id} className="bg-slate-900/80 border-slate-700/50 hover:border-amber-700/50 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center shrink-0">
                      <Beaker className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium text-sm truncate">{b.name}</p>
                      <p className="text-slate-500 text-xs">
                        {b.ingredients.map((i) => i.spice?.name).filter(Boolean).join(', ') || 'Sin ingredientes'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/50 rounded p-1.5 text-center">
                      <p className="text-slate-500">Chico</p>
                      <p className="text-amber-300 font-medium">{fmt(b.precioChico)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-1.5 text-center">
                      <p className="text-slate-500">Grande</p>
                      <p className="text-amber-300 font-medium">{fmt(b.precioGrande)}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-amber-600/80 hover:bg-amber-500 text-white h-8 text-xs"
                    onClick={() => setSizeDialog({ open: true, name: b.name, productId: b.id, type: 'blend', precioChico: b.precioChico, precioGrande: b.precioGrande })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Agregar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Spices Section */}
      {spices.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> Especias
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {spices.map((s) => {
              // We don't have retail prices for individual spices, use priceKg as reference
              // But we'll still allow adding to cart
              const price100g = Math.round(s.priceKg / 10)
              return (
                <Card key={s.id} className="bg-slate-900/80 border-slate-700/50 hover:border-amber-700/50 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/40 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-amber-500/80" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-200 font-medium text-sm truncate">{s.name}</p>
                        <p className="text-slate-500 text-xs">{fmt(s.priceKg)}/kg</p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-amber-600/80 hover:bg-amber-500 text-white h-8 text-xs"
                      onClick={() => setSizeDialog({
                        open: true, name: s.name, productId: s.id, type: 'specie',
                        precioChico: price100g,
                        precioGrande: Math.round(s.priceKg / 3),
                      })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Agregar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {spices.length === 0 && blends.length === 0 && (
        <div className="text-center py-16 text-slate-500">No hay productos disponibles</div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 bg-amber-600 hover:bg-amber-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-amber-900/30 transition-all hover:scale-105 z-40"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {cart.reduce((s, c) => s + c.qty, 0)}
          </span>
        </button>
      )}

      {/* Size Selection Dialog */}
      <Dialog open={!!sizeDialog} onOpenChange={() => setSizeDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-amber-200 text-center">{sizeDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full h-16 bg-slate-800 hover:bg-slate-700 text-left justify-between border border-slate-700/50"
              onClick={() => sizeDialog && handleAddToCart(sizeDialog.productId, sizeDialog.name, sizeDialog.type, 'chico', sizeDialog.precioChico)}
            >
              <div>
                <p className="text-slate-200 font-medium">Chico</p>
                <p className="text-slate-500 text-xs">Porción individual</p>
              </div>
              <span className="text-amber-300 font-bold">{fmt(sizeDialog?.precioChico || 0)}</span>
            </Button>
            <Button
              className="w-full h-16 bg-slate-800 hover:bg-slate-700 text-left justify-between border border-slate-700/50"
              onClick={() => sizeDialog && handleAddToCart(sizeDialog.productId, sizeDialog.name, sizeDialog.type, 'grande', sizeDialog.precioGrande)}
            >
              <div>
                <p className="text-slate-200 font-medium">Grande</p>
                <p className="text-slate-500 text-xs">Para compartir</p>
              </div>
              <span className="text-amber-300 font-bold">{fmt(sizeDialog?.precioGrande || 0)}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-200 sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-amber-200 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Tu Pedido
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            {cart.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Carrito vacío</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{item.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{item.size} — {fmt(item.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => updateCartQty(item.productId, item.qty - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-slate-200 text-sm w-6 text-center font-medium">{item.qty}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => updateCartQty(item.productId, item.qty + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-amber-300 text-sm font-medium w-16 text-right">{fmt(item.price * item.qty)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400 shrink-0" onClick={() => removeFromCart(item.productId)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {cart.length > 0 && (
            <div className="border-t border-slate-700/30 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="text-amber-300 font-bold text-xl">{fmt(total)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-slate-700/50 text-slate-400 hover:text-slate-200" onClick={() => { clearCart(); toast.success('Carrito vaciado') }}>
                  Vaciar
                </Button>
                <Button onClick={handleConfirm} disabled={confirming} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white">
                  {confirming ? 'Confirmando...' : '✅ Confirmar pedido'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}