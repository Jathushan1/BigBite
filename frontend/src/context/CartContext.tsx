import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { FulfillmentType } from '../types/order'

export interface CartItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
  photo?: string | null
}

type NewCartItem = Omit<CartItem, 'quantity'>

interface CartContextType {
  branchId: number | null
  items: CartItem[]
  promoCode: string
  fulfillmentType: FulfillmentType
  deliveryAddress: string
  city: string
  /** Returns false (and adds nothing) when the item belongs to another branch than the cart. */
  addItem: (item: NewCartItem, itemBranchId: number) => boolean
  /** Empties the cart and starts a new one at another branch with this item. */
  replaceCart: (item: NewCartItem, itemBranchId: number) => void
  removeItem: (menuItemId: number) => void
  updateQuantity: (menuItemId: number, delta: number) => void
  applyPromoCode: (code: string) => void
  setFulfillmentType: (type: FulfillmentType) => void
  setDeliveryAddress: (address: string) => void
  setCity: (city: string) => void
  setBranchId: (branchId: number) => void
  clearCart: () => void
  /** Client-side estimate; the server recalculates every amount when the order is placed. */
  subtotal: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  totalCount: number
}

const STORAGE_KEY = 'bigbite.cart.v1'
const DELIVERY_FEE = 300
const TAX_RATE = 0.05

interface PersistedCart {
  branchId: number | null
  items: CartItem[]
  promoCode: string
  fulfillmentType: FulfillmentType
  deliveryAddress: string
  city: string
}

function loadCart(): PersistedCart {
  const empty: PersistedCart = { branchId: null, items: [], promoCode: '', fulfillmentType: 'DELIVERY', deliveryAddress: '', city: 'Colombo' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadCart)
  const [branchId, setBranchId] = useState<number | null>(initial.branchId)
  const [items, setItems] = useState<CartItem[]>(initial.items)
  const [promoCode, setPromoCode] = useState(initial.promoCode)
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(initial.fulfillmentType)
  const [deliveryAddress, setDeliveryAddress] = useState(initial.deliveryAddress)
  const [city, setCity] = useState(initial.city)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branchId, items, promoCode, fulfillmentType, deliveryAddress, city }))
    } catch {
      // storage full or blocked: the cart still works for this tab
    }
  }, [branchId, items, promoCode, fulfillmentType, deliveryAddress, city])

  const addItem = (item: NewCartItem, itemBranchId: number) => {
    if (branchId !== null && branchId !== itemBranchId && items.length > 0) return false
    setBranchId(itemBranchId)
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId)
      if (existing) return prev.map((i) => (i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { ...item, quantity: 1 }]
    })
    return true
  }

  const replaceCart = (item: NewCartItem, itemBranchId: number) => {
    setBranchId(itemBranchId)
    setPromoCode('')
    setItems([{ ...item, quantity: 1 }])
  }

  const removeItem = (menuItemId: number) => setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))

  const updateQuantity = (menuItemId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  const clearCart = () => {
    setItems([])
    setPromoCode('')
    setDeliveryAddress('')
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = fulfillmentType === 'DELIVERY' && items.length > 0 ? DELIVERY_FEE : 0
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100
  const discountAmount = promoCode === 'WELCOME10' ? Math.round(subtotal * 0.1 * 100) / 100 : 0
  const grandTotal = Math.max(0, subtotal + deliveryFee + taxAmount - discountAmount)
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        branchId,
        items,
        promoCode,
        fulfillmentType,
        deliveryAddress,
        city,
        addItem,
        replaceCart,
        removeItem,
        updateQuantity,
        applyPromoCode: (code) => setPromoCode(code.trim().toUpperCase()),
        setFulfillmentType,
        setDeliveryAddress,
        setCity,
        setBranchId,
        clearCart,
        subtotal,
        deliveryFee,
        taxAmount,
        discountAmount,
        grandTotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
