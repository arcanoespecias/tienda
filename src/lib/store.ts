import { create } from 'zustand'

// ===================== TYPES =====================
export interface User {
  id: string; name: string; role: 'admin' | 'operador' | 'cliente'; emoji: string;
}

export interface Spice {
  id: string; name: string; priceKg: number; stock: number; stockMin: number;
  createdAt: string; updatedAt: string;
}

export interface BlendIngredient {
  id: string; spiceId: string; grams: number; priceKg: number;
  spice?: { name: string };
}

export interface Blend {
  id: string; name: string; pesoChico: number; pesoGrande: number;
  precioChico: number; precioGrande: number; notas: string;
  ingredients: BlendIngredient[];
  createdAt: string; updatedAt: string;
}

export interface CostConfig {
  id: string; envChico: number; envGrande: number;
  pkgChico: number; pkgGrande: number; etiqueta: number; mo: number; otros: number;
}

export interface Supply {
  id: string; tipo: string; name: string; supplier: string;
  price: number; unit: string; stock: number;
  createdAt: string; updatedAt: string;
}

export interface PurchaseItem {
  id: string; supplyId: string; quantity: number; unitCost: number; totalCost: number;
  supply?: { name: string; unit: string };
}

export interface Purchase {
  id: string; supplier: string; fecha: string; total: number; notas: string;
  items: PurchaseItem[];
}

export interface SaleItem {
  id: string; name: string; qty: number; unitPrice: number; total: number;
}

export interface Sale {
  id: string; clientId: string | null; total: number; estado: string;
  notas: string; fecha: string; client?: { name: string; emoji: string };
  items: SaleItem[];
}

export interface CartItem {
  productId: string; name: string; type: 'specie' | 'blend'; size: 'chico' | 'grande';
  price: number; qty: number;
}

// ===================== APP STATE =====================
type View = 'login' | 'storefront' | 'dashboard' | 'especias' | 'blends' |
  'compras' | 'ventas' | 'costos' | 'usuarios' | 'cart' | 'mis-pedidos';

interface AppState {
  // Auth
  user: User | null;
  loading: boolean;

  // Navigation
  view: View;
  setView: (v: View) => void;

  // Data
  spices: Spice[];
  blends: Blend[];
  costs: CostConfig;
  supplies: Supply[];
  purchases: Purchase[];
  sales: Sale[];
  users: User[];

  // Cart
  cart: CartItem[];

  // Actions
  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => void;
  seed: () => Promise<void>;

  fetchSpices: () => Promise<void>;
  fetchBlends: () => Promise<void>;
  fetchCosts: () => Promise<void>;
  fetchSupplies: (tipo?: string) => Promise<void>;
  fetchPurchases: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchUsers: () => Promise<void>;

  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

const fmt = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-AR');

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loading: false,
  view: 'login',
  setView: (v) => set({ view: v }),

  spices: [], blends: [], costs: { id: '', envChico: 1780, envGrande: 1750, pkgChico: 0, pkgGrande: 0, etiqueta: 0, mo: 0, otros: 0 },
  supplies: [], purchases: [], sales: [], users: [],
  cart: [],

  login: async (name, pin) => {
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pin }) });
      if (!res.ok) return false;
      const user = await res.json();
      set({ user, view: user.role === 'cliente' ? 'storefront' : 'dashboard' });
      return true;
    } catch { return false; }
  },

  logout: () => set({ user: null, view: 'login', cart: [] }),

  seed: async () => {
    await fetch('/api/seed', { method: 'POST' });
    get().fetchSpices();
    get().fetchBlends();
    get().fetchCosts();
    get().fetchUsers();
  },

  fetchSpices: async () => {
    const res = await fetch('/api/spices');
    if (res.ok) set({ spices: await res.json() });
  },
  fetchBlends: async () => {
    const res = await fetch('/api/blends');
    if (res.ok) set({ blends: await res.json() });
  },
  fetchCosts: async () => {
    const res = await fetch('/api/costs');
    if (res.ok) set({ costs: await res.json() });
  },
  fetchSupplies: async (tipo?: string) => {
    const res = await fetch('/api/supplies' + (tipo ? '?tipo=' + tipo : ''));
    if (res.ok) set({ supplies: await res.json() });
  },
  fetchPurchases: async () => {
    const res = await fetch('/api/purchases');
    if (res.ok) set({ purchases: await res.json() });
  },
  fetchSales: async () => {
    const res = await fetch('/api/sales');
    if (res.ok) set({ sales: await res.json() });
  },
  fetchUsers: async () => {
    const res = await fetch('/api/users');
    if (res.ok) set({ users: await res.json() });
  },

  addToCart: (item) => set((s) => {
    const existing = s.cart.find(c => c.productId === item.productId);
    if (existing) return { cart: s.cart.map(c => c.productId === item.productId ? { ...c, qty: c.qty + item.qty } : c) };
    return { cart: [...s.cart, { ...item, qty: 1 }] };
  }),
  removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter(c => c.productId !== productId) })),
  updateCartQty: (productId, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter(c => c.productId !== productId) : s.cart.map(c => c.productId === productId ? { ...c, qty } : c) })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((s, c) => s + c.price * c.qty, 0),
}));

export { fmt };