export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalSpent: number;
  transactionsCount: number;
  lastVisit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  date: string;
  pointsEarned: number;
}
