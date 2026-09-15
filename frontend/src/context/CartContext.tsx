import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FulfillmentType } from '../types/order'

export interface CartItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  branchId: number | null
  items: CartItem[]
  promoCode: string
  fulfillmentType: FulfillmentType
  deliveryAddress: string
  city: string
  addItem: (item: { menuItemId: number; name: string; price: number }, itemBranchId: number) => void
  removeItem: (menuItemId: number) => void
  updateQuantity: (menuItemId: number, delta: number) => void
  applyPromoCode: (code: string) => void
  setFulfillmentType: (type: FulfillmentType) => void
  setDeliveryAddress: (address: string) => void
  setCity: (city: string) => void
  setBranchId: (branchId: number) => void
  clearCart: () => void
  subtotal: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  totalCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [branchId, setBranchId] = useState<number | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [promoCode, setPromoCode] = useState<string>('')
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('DELIVERY')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [city, setCity] = useState<string>('Colombo')

  const addItem = (item: { menuItemId: number; name: string; price: number }, itemBranchId: number) => {
    // If switching branches, reset items to ensure single-branch order integrity
    if (branchId !== null && branchId !== itemBranchId) {
      if (confirm('Your cart contains items from a different branch. Clear cart to proceed?')) {
        setBranchId(itemBranchId)
        setItems([{ ...item, quantity: 1 }])
      }
      return
    }

    setBranchId(itemBranchId)
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (menuItemId: number) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }

  const updateQuantity = (menuItemId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter((i): i is CartItem => i !== null)
    )
  }

  const applyPromoCode = (code: string) => {
    setPromoCode(code.trim().toUpperCase())
  }

  const clearCart = () => {
    setItems([])
    setPromoCode('')
    setDeliveryAddress('')
    setCity('Colombo')
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = fulfillmentType === 'DELIVERY' ? 300 : 0
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100
  const discountAmount =
    promoCode.toUpperCase() === 'WELCOME10' ? Math.round(subtotal * 0.1 * 100) / 100 : 0
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
        removeItem,
        updateQuantity,
        applyPromoCode,
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

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
