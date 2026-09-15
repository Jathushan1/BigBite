export interface Branch {
  id: number
  name: string
  address: string
  open: boolean
  takeaway: boolean
}

export interface MenuItem {
  id: number
  name: string
  price: number
  branchId: number
  category: string
  description: string
  available?: boolean
}

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Colombo Branch',
    address: '42 Galle Road, Colombo 03',
    open: true,
    takeaway: true,
  },
  {
    id: 2,
    name: 'Jaffna Branch',
    address: '15 Hospital Road, Jaffna',
    open: false,
    takeaway: false,
  },
  {
    id: 3,
    name: 'Kandy Branch',
    address: '88 Peradeniya Road, Kandy',
    open: true,
    takeaway: true,
  },
]

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 101,
    name: 'Margherita Pizza',
    price: 1200,
    branchId: 1,
    category: 'Pizza',
    description: 'Classic mozzarella, basil, and san marzano tomato sauce on crispy hand-tossed dough.',
    available: true,
  },
  {
    id: 102,
    name: 'Pepperoni Pizza',
    price: 1400,
    branchId: 1,
    category: 'Pizza',
    description: 'Generous slices of spicy Italian pepperoni, melted mozzarella, and rich tomato sauce.',
    available: true,
  },
  {
    id: 103,
    name: 'Garlic Bread',
    price: 450,
    branchId: 1,
    category: 'Sides',
    description: 'Crispy French baguette slices coated with roasted garlic butter and aromatic herbs.',
    available: true,
  },
  {
    id: 201,
    name: 'BBQ Chicken Pizza',
    price: 1500,
    branchId: 3,
    category: 'Pizza',
    description: 'Smoky grilled chicken, caramelized red onions, cilantro, and tangy barbecue sauce.',
    available: true,
  },
  {
    id: 202,
    name: 'Coke 500ml',
    price: 250,
    branchId: 3,
    category: 'Beverages',
    description: 'Chilled 500ml bottle of classic Coca-Cola.',
    available: true,
  },
]
