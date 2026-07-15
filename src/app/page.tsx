'use client'

import { useApp } from '@/lib/store'
import LoginView from '@/components/arcano/LoginView'
import DashboardView from '@/components/arcano/DashboardView'
import EspeciasView from '@/components/arcano/EspeciasView'
import BlendsView from '@/components/arcano/BlendsView'
import CostosView from '@/components/arcano/CostosView'
import ComprasView from '@/components/arcano/ComprasView'
import VentasView from '@/components/arcano/VentasView'
import UsuariosView from '@/components/arcano/UsuariosView'
import StorefrontView from '@/components/arcano/StorefrontView'
import AppHeader from '@/components/arcano/AppHeader'
import CartView from '@/components/arcano/CartView'
import MisPedidosView from '@/components/arcano/MisPedidosView'

function ViewRouter() {
  const { view } = useApp()

  switch (view) {
    case 'login': return <LoginView />
    case 'dashboard': return <DashboardView />
    case 'especias': return <EspeciasView />
    case 'blends': return <BlendsView />
    case 'costos': return <CostosView />
    case 'compras': return <ComprasView />
    case 'ventas': return <VentasView />
    case 'usuarios': return <UsuariosView />
    case 'storefront': return <StorefrontView />
    case 'cart': return <CartView />
    case 'mis-pedidos': return <MisPedidosView />
    default: return <DashboardView />
  }
}

export default function Home() {
  const { user, view } = useApp()

  if (view === 'login') {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />
      <main className={`max-w-6xl mx-auto px-4 py-6 ${view !== 'login' && user?.role !== 'cliente' ? 'pb-6' : 'pb-24 md:pb-6'}`}>
        <ViewRouter />
      </main>
    </div>
  )
}