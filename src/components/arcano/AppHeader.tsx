'use client'

import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { LogOut, ShoppingCart, LayoutDashboard, Package, Beaker, DollarSign, ShoppingBag, ClipboardList, Users } from 'lucide-react'

const navItems: Record<string, { label: string; icon: React.ReactNode; roles: string[] }> = {
  dashboard: { label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'operador'] },
  especias: { label: 'Especias', icon: <Package className="w-4 h-4" />, roles: ['admin', 'operador'] },
  blends: { label: 'Blends', icon: <Beaker className="w-4 h-4" />, roles: ['admin', 'operador'] },
  compras: { label: 'Compras', icon: <ShoppingBag className="w-4 h-4" />, roles: ['admin', 'operador'] },
  ventas: { label: 'Ventas', icon: <ClipboardList className="w-4 h-4" />, roles: ['admin', 'operador'] },
  costos: { label: 'Costos', icon: <DollarSign className="w-4 h-4" />, roles: ['admin'] },
  usuarios: { label: 'Usuarios', icon: <Users className="w-4 h-4" />, roles: ['admin'] },
  storefront: { label: 'Catálogo', icon: <Package className="w-4 h-4" />, roles: ['admin', 'operador', 'cliente'] },
  cart: { label: 'Carrito', icon: <ShoppingCart className="w-4 h-4" />, roles: ['cliente'] },
  'mis-pedidos': { label: 'Mis Pedidos', icon: <ClipboardList className="w-4 h-4" />, roles: ['cliente'] },
}

export default function AppHeader() {
  const { user, view, setView, logout, cart } = useApp()

  if (!user) return null

  const visibleNav = Object.entries(navItems).filter(([, v]) => v.roles.includes(user.role))
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)

  // Mobile nav for client
  const clientMobileNav = [
    { key: 'storefront', icon: <Package className="w-5 h-5" />, label: 'Catálogo' },
    { key: 'cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Carrito' },
    { key: 'mis-pedidos', icon: <ClipboardList className="w-5 h-5" />, label: 'Pedidos' },
  ]

  // Mobile nav for admin/operador
  const adminMobileNav = [
    { key: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Inicio' },
    { key: 'especias', icon: <Package className="w-5 h-5" />, label: 'Especias' },
    { key: 'ventas', icon: <ClipboardList className="w-5 h-5" />, label: 'Ventas' },
    { key: 'storefront', icon: <ShoppingBag className="w-5 h-5" />, label: 'Catálogo' },
  ]

  const mobileNav = user.role === 'cliente' ? clientMobileNav : adminMobileNav

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Brand */}
          <button onClick={() => setView(user.role === 'cliente' ? 'storefront' : 'dashboard')} className="flex items-center gap-2">
            <span className="text-xl font-bold text-amber-400 tracking-wider">Arcano</span>
          </button>

          {/* Center Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map(([key, item]) => (
              <button
                key={key}
                onClick={() => setView(key as typeof view)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  view === key
                    ? 'bg-amber-600/20 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                {item.label}
                {key === 'cart' && cartCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs border-0 h-4 min-w-4 px-1 flex items-center justify-center">{cartCount}</Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
              <span className="text-lg">{user.emoji}</span>
              <span className="text-sm text-slate-200 hidden sm:inline">{user.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Conectado" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-900/20"
              onClick={() => {
                logout()
                toast.info('Sesión cerrada')
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/80 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mobileNav.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key as typeof view)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative ${
                view === item.key ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.key === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}