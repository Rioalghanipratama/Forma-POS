import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  History, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Filter, 
  UserPlus, 
  Star,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  LogOut,
  CreditCard,
  Banknote
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { Product, Customer, CartItem, Transaction } from './types';

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', price: 18000, stock: 50, category: 'Minuman' },
  { id: '2', name: 'Nasi Goreng Spesial', price: 25000, stock: 30, category: 'Makanan' },
  { id: '3', name: 'Iced Americano', price: 15000, stock: 100, category: 'Minuman' },
  { id: '4', name: 'Croissant Butter', price: 12000, stock: 20, category: 'Snack' },
  { id: '5', name: 'Teh Manis Dingin', price: 6000, stock: 200, category: 'Minuman' },
  { id: '6', name: 'Mie Ayam Jamur', price: 22000, stock: 15, category: 'Makanan' },
  { id: '7', name: 'Caffè Latte', price: 20000, stock: 45, category: 'Minuman' },
  { id: '8', name: 'Red Velvet Cake', price: 28000, stock: 10, category: 'Snack' },
  { id: '9', name: 'Ayam Geprek', price: 18000, stock: 25, category: 'Makanan' },
  { id: '10', name: 'Matcha Latte', price: 22000, stock: 40, category: 'Minuman' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Ahmad Faisal', email: 'ahmad@gmail.com', phone: '0812345678', points: 450, totalSpent: 1250000, transactionsCount: 12, lastVisit: '2024-03-20' },
  { id: 'c2', name: 'Siti Aminah', email: 'siti@yahoo.com', phone: '0819876543', points: 120, totalSpent: 340000, transactionsCount: 4, lastVisit: '2024-03-21' },
];

type View = 'dashboard' | 'kasir' | 'produk' | 'pelanggan' | 'riwayat';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pos_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'customer' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Cart on mobile

  // Persistence
  useEffect(() => {
    localStorage.setItem('pos_products', JSON.stringify(products));
    localStorage.setItem('pos_customers', JSON.stringify(customers));
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
  }, [products, customers, transactions]);

  // Derived State
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      (selectedCategory === 'Semua' || p.category === selectedCategory)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, selectedCategory]);

  const categories = useMemo(() => ['Semua', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Handlers
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: Date.now().toString() };
    setProducts(prev => [newProduct, ...prev]);
    setModalType(null);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setModalType(null);
    setEditingItem(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Hapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(item => item.id !== id));
    }
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'transactionsCount' | 'lastVisit'>) => {
    const newCustomer: Customer = {
      ...c,
      id: `CUST-${Date.now()}`,
      points: 0,
      totalSpent: 0,
      transactionsCount: 0,
      lastVisit: '-'
    };
    setCustomers(prev => [newCustomer, ...prev]);
    setModalType(null);
  };
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        const product = products.find(p => p.id === id);
        return { ...item, quantity: Math.min(newQty, product?.stock || 999) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newTransaction: Transaction = {
      id: `TRX-${Date.now()}`,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      items: [...cart],
      total: cartTotal,
      date: new Date().toISOString(),
      pointsEarned: potentialPoints
    };

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(i => i.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
      return p;
    }));

    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            points: c.points + potentialPoints,
            totalSpent: c.totalSpent + cartTotal,
            transactionsCount: c.transactionsCount + 1,
            lastVisit: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      }));
    }

    setTransactions(prev => [newTransaction, ...prev]);
    setCart([]);
    setSelectedCustomer(null);
    setIsCheckoutOpen(false);
    
    // Simple feedback
    alert("Transaksi Selesai!");
  };

  // Re-define potentialPoints and stats clearly
  const potentialPoints = Math.floor(cartTotal / 1000);
  
  const dailyRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);

  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      total: transactions
        .filter(t => t.date.startsWith(date))
        .reduce((sum, t) => sum + t.total, 0)
    }));
  }, [transactions]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-forma-bg text-forma-ink font-sans overflow-hidden">
      {/* Navigation - Bottom on Mobile, Left on Desktop */}
      <nav className={cn(
        "bg-forma-ink text-forma-bg flex border-forma-ink shrink-0 z-40 transition-all",
        "fixed bottom-0 w-full h-16 flex-row justify-around items-center border-t-2", // Mobile
        "lg:relative lg:w-20 lg:h-screen lg:flex-col lg:py-8 lg:border-r-2 lg:justify-start lg:gap-12" // Desktop
      )}>
        <div className="hidden lg:flex w-10 h-10 border-2 border-forma-bg items-center justify-center text-xl font-black mb-12">
          L
        </div>

        <div className="flex flex-row lg:flex-col lg:flex-1 items-center gap-6 lg:gap-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'kasir', icon: ShoppingCart, label: 'POS' },
            { id: 'produk', icon: Package, label: 'Stok' },
            { id: 'pelanggan', icon: Users, label: 'CRM' },
            { id: 'riwayat', icon: History, label: 'Logs' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "p-3 transition-all flex flex-col items-center justify-center border-2 border-transparent",
                view === item.id 
                  ? "opacity-100 border-forma-bg rounded-lg" 
                  : "opacity-40 hover:opacity-80"
              )}
            >
              <item.icon size={20} />
              <span className="lg:hidden text-[8px] font-black uppercase tracking-widest mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        <button className="hidden lg:block p-3 opacity-40 hover:opacity-100 hover:text-forma-accent transition-all">
          <LogOut size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 border-forma-ink pb-16 lg:pb-0 lg:border-r-2 overflow-hidden">
        {/* Header */}
        <header className="p-4 lg:p-8 flex justify-between items-center lg:items-end border-b-2 border-forma-ink bg-forma-bg sticky top-0 z-30">
          <div>
            <h1 className="text-xl lg:text-3xl font-black uppercase tracking-tighter leading-none">Forma POS</h1>
            <p className="hidden lg:block text-[10px] uppercase tracking-widest font-black opacity-30 mt-1">CRM Integration</p>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[8px] lg:text-[10px] uppercase tracking-widest font-black opacity-30">Revenue</span>
              <span className="text-sm lg:text-lg font-black">{formatCurrency(dailyRevenue)}</span>
            </div>
            
            {/* Mobile Cart Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden relative p-2 border-2 border-forma-ink bg-white"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-forma-accent text-white text-[10px] font-black flex items-center justify-center border border-forma-ink">
                  {cart.length}
                </span>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-3 pl-8 border-l border-forma-ink border-dashed">
              <div className="text-right">
                <p className="text-sm font-black leading-none">Imdadurrohman</p>
                <p className="text-[10px] uppercase font-bold opacity-30">Admin</p>
              </div>
              <div className="w-10 h-10 border-2 border-forma-ink flex items-center justify-center font-black">IR</div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1 overflow-auto bg-forma-bg">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Stats Grid - High Contrast */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp },
                    { label: 'Orders', value: transactions.length, icon: History },
                    { label: 'Clientele', value: customers.length, icon: Users },
                    { label: 'Adv Loyalty', value: formatCurrency(transactions.length ? totalRevenue / transactions.length : 0), icon: Star },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 border-2 border-forma-ink shadow-[4px_4px_0px_0px_#1A1A1A]">
                      <div className="flex justify-between items-center mb-4">
                        <stat.icon size={20} className="text-forma-ink" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{stat.label}</span>
                      </div>
                      <h3 className="text-2xl font-black tracking-tighter">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-6 border-2 border-forma-ink">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                       Sales Evolution
                    </h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#1A1A1A' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#1A1A1A' }} tickFormatter={(v) => `${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ border: '2px solid #1A1A1A', borderRadius: '0px', padding: '8px', fontWeight: 900 }}
                            formatter={(v: number) => [formatCurrency(v), 'Sales']}
                          />
                          <Line type="stepAfter" dataKey="total" stroke="#1A1A1A" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#FF5F5F', stroke: '#1A1A1A' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 border-2 border-forma-ink">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-6">Loyalty Ranks</h4>
                    <div className="space-y-4">
                      {customers.sort((a,b) => b.points - a.points).slice(0, 5).map((c, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-forma-ink last:border-0 border-dashed">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black opacity-20">{i+1}</span>
                            <p className="text-sm font-black">{c.name}</p>
                          </div>
                          <span className="text-sm font-black text-forma-accent">{c.points} Pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'kasir' && (
              <motion.div 
                key="kasir"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 flex flex-col h-full"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-1 text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                          selectedCategory === cat 
                            ? "bg-forma-ink text-forma-bg border-forma-ink" 
                            : "bg-transparent text-forma-ink border-forma-ink/20 hover:border-forma-ink"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-64">
                    <input 
                      type="text" 
                      placeholder="SCAN / CARI..."
                      className="w-full bg-transparent border-b-2 border-forma-ink px-0 py-2 font-black text-xs uppercase focus:outline-none placeholder:opacity-30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8 overflow-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={cn(
                        "group border-2 border-forma-ink p-6 text-left flex flex-col justify-between aspect-video transition-all bg-white relative",
                        product.stock <= 0 
                          ? "opacity-30 cursor-not-allowed" 
                          : "hover:bg-forma-ink hover:text-forma-bg active:scale-95"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{product.category}</span>
                          <span className="text-[10px] font-black">{product.stock} left</span>
                        </div>
                        <h5 className="text-lg font-black uppercase leading-tight">{product.name}</h5>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xl font-black">{formatCurrency(product.price)}</span>
                        <Plus size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'produk' && (
              <div className="bg-white border-2 border-forma-ink overflow-hidden">
                <div className="p-6 border-b-2 border-forma-ink flex justify-between items-center bg-forma-bg/50">
                   <h4 className="text-sm font-black uppercase tracking-widest">Inventory Management</h4>
                   <button 
                     onClick={() => setModalType('product')}
                     className="bg-forma-ink text-forma-bg px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-forma-accent transition-colors">
                     Add New Stock +
                   </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-forma-ink text-[10px] font-black uppercase tracking-widest">
                        <th className="p-6">Catalog ID</th>
                        <th className="p-6">Description</th>
                        <th className="p-6">Category</th>
                        <th className="p-6">Price</th>
                        <th className="p-6">Stock</th>
                        <th className="p-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-forma-ink">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-forma-bg transition-colors text-sm">
                          <td className="p-6 font-mono font-bold">#{p.id}</td>
                          <td className="p-6 font-black uppercase">{p.name}</td>
                          <td className="p-6 font-bold opacity-40">{p.category}</td>
                          <td className="p-6 font-black">{formatCurrency(p.price)}</td>
                          <td className="p-6 font-black">{p.stock}</td>
                          <td className="p-6 space-x-4">
                             <button 
                               onClick={() => {
                                 setEditingItem(p);
                                 setModalType('product');
                               }}
                               className="text-[10px] font-black uppercase text-blue-600 hover:opacity-60"
                             >
                               Edit
                             </button>
                             <button 
                               onClick={() => deleteProduct(p.id)}
                               className="text-[10px] font-black uppercase text-forma-accent hover:opacity-60"
                             >
                               Delete
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'pelanggan' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <h4 className="text-xl font-black uppercase tracking-tighter">Directory: Clients</h4>
                   <button 
                     onClick={() => setModalType('customer')}
                     className="bg-forma-ink text-forma-bg px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-forma-accent"
                   >
                     Enroll New +
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {customers.map(c => (
                    <div key={c.id} className="bg-white border-2 border-forma-ink p-8 relative group hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h5 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">{c.name}</h5>
                          <p className="text-[10px] font-bold opacity-40 tracking-widest">{c.phone}</p>
                        </div>
                        <div className="w-12 h-12 bg-forma-ink text-forma-bg flex items-center justify-center text-xl font-black border-2 border-forma-ink">
                          {c.name.charAt(0)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8 border-t-2 border-forma-ink pt-6">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Loyalty Pts</span>
                          <p className="text-2xl font-black text-forma-accent">{c.points}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">LTV</span>
                          <p className="text-lg font-black">{formatCurrency(c.totalSpent)}</p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between items-center bg-forma-bg/50 p-3 text-[10px] font-black uppercase tracking-widest border-t border-forma-ink border-dashed">
                         <span className="opacity-40">Visit #{c.transactionsCount}</span>
                         <span className="opacity-40">Last: {c.lastVisit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'riwayat' && (
               <div className="bg-white border-2 border-forma-ink overflow-hidden">
                 <div className="p-6 border-b-2 border-forma-ink bg-forma-bg/50">
                    <h4 className="text-sm font-black uppercase tracking-widest">Transaction Archives</h4>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b-2 border-forma-ink text-[10px] font-black uppercase tracking-widest">
                         <th className="p-6">Ref No.</th>
                         <th className="p-6">Account</th>
                         <th className="p-6">Value</th>
                         <th className="p-6">Timestamp</th>
                         <th className="p-6 text-right">Verification</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y border-forma-ink">
                       {transactions.map(t => (
                         <tr key={t.id} className="hover:bg-forma-bg text-sm">
                           <td className="p-6 font-mono font-bold">#{t.id}</td>
                           <td className="p-6 font-black uppercase">{t.customerName || 'Anonymous Guest'}</td>
                           <td className="p-6 font-black">{formatCurrency(t.total)}</td>
                           <td className="p-6 font-bold opacity-40">{new Date(t.date).toLocaleString()}</td>
                           <td className="p-6 text-right">
                              <span className="px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-forma-ink bg-forma-ink text-forma-bg">Validated</span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* CRM & Checkout Panel - Responsive Sidebar/Drawer */}
      <aside className={cn(
        "bg-forma-muted flex flex-col shrink-0 transition-all duration-500",
        "fixed inset-y-0 right-0 z-50 w-full md:w-[400px]", // Mobile Drawer
        "lg:relative lg:w-[340px] lg:z-0 lg:translate-x-0", // Desktop Sidebar
        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Header for Sidebar - Sticky at top of drawer */}
        <div className="lg:hidden p-4 border-b-2 border-forma-ink flex justify-between items-center bg-forma-bg shrink-0 sticky top-0 z-20">
           <h4 className="font-black uppercase tracking-widest">Active Manifest</h4>
           <button onClick={() => setIsSidebarOpen(false)} className="font-black px-4 py-2 border-2 border-forma-ink">CLOSE</button>
        </div>

        {/* Combined Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-6 lg:p-8 border-b-2 border-forma-ink flex flex-col items-center bg-forma-muted">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-40">Client Profile</span>
            
            {selectedCustomer ? (
              <div className="bg-forma-bg border-2 border-forma-ink p-6 w-full shadow-[4px_4px_0px_0px_#1A1A1A]">
                <h4 className="text-xl font-black uppercase tracking-tighter mb-2">{selectedCustomer.name}</h4>
                <div className="inline-block bg-forma-accent text-white text-[8px] font-black uppercase px-2 py-1 tracking-widest mb-6">
                  Gold Member
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-forma-ink pt-4">
                  <div>
                    <span className="block text-[8px] font-black uppercase opacity-40">LTV</span>
                    <span className="block text-sm font-black">{formatCurrency(selectedCustomer.totalSpent)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black uppercase opacity-40">Balance</span>
                    <span className="block text-sm font-black">{selectedCustomer.points} pts</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="mt-6 text-[10px] font-black uppercase tracking-widest text-forma-accent hover:opacity-70 transition-opacity"
                >
                  Switch Account
                </button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <select 
                  className="w-full bg-forma-bg border-2 border-forma-ink p-3 text-xs font-black uppercase tracking-widest focus:outline-none"
                  onChange={(e) => {
                    const c = customers.find(cust => cust.id === e.target.value);
                    if (c) setSelectedCustomer(c);
                  }}
                >
                  <option value="">Identify Client...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 p-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 block opacity-40">Active Manifest</span>
            
            {cart.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-10">
                <ShoppingCart size={48} />
                <p className="font-black uppercase tracking-widest text-xs mt-4">Empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b border-forma-ink border-dashed">
                    <div className="flex-1 pr-4">
                      <p className="text-xs font-black uppercase leading-tight mb-1">{item.name}</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-lg font-black opacity-30 hover:opacity-100">-</button>
                        <span className="text-[10px] font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-lg font-black opacity-30 hover:opacity-100">+</button>
                      </div>
                    </div>
                    <span className="text-sm font-black">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 lg:p-8 border-t-2 border-forma-ink bg-forma-muted mt-auto">
            <div className="space-y-1 mb-6 lg:mb-8">
              <div className="flex justify-between text-[10px] font-black uppercase opacity-40">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-forma-accent">
                <span>CRM Accrual</span>
                <span>+{potentialPoints} Pts</span>
              </div>
              <div className="flex justify-between text-xl lg:text-2xl font-black uppercase tracking-tighter mt-4 pt-4 border-t-2 border-forma-ink">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            
            <button 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-forma-ink text-forma-bg p-5 lg:p-6 text-sm font-black uppercase tracking-widest hover:bg-forma-accent transition-all disabled:opacity-30 disabled:hover:bg-forma-ink"
            >
              Authorize Payment
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forma-ink/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-forma-bg border-4 border-forma-ink p-12 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 border-4 border-forma-ink flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Validate Sale?</h3>
              <p className="text-sm font-bold opacity-60 mb-12">Confirm receipt of {formatCurrency(cartTotal)} for this record.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-forma-ink text-forma-bg py-5 font-black uppercase tracking-widest hover:bg-forma-accent transition-all"
                >
                  Confirm Execution
                </button>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full text-forma-ink font-black py-2 hover:opacity-60 transition-all text-[10px] uppercase tracking-widest"
                >
                  Abort Operation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* General Modal System */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forma-ink/80 backdrop-blur-sm">
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-forma-bg border-4 border-forma-ink p-10 max-w-md w-full"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">
                {editingItem ? 'Edit' : 'Create'} {modalType === 'product' ? 'Product' : 'Client'}
              </h3>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  if (modalType === 'product') {
                    const data = {
                      name: formData.get('name') as string,
                      price: Number(formData.get('price')),
                      stock: Number(formData.get('stock')),
                      category: formData.get('category') as string,
                    };
                    editingItem ? updateProduct(editingItem.id, data) : addProduct(data);
                  } else {
                    const data = {
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                    };
                    addCustomer(data);
                  }
                }}
                className="space-y-6"
              >
                {modalType === 'product' ? (
                  <>
                    <Input label="Name" name="name" defaultValue={editingItem?.name} required />
                    <Input label="Category" name="category" defaultValue={editingItem?.category} required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Price" name="price" type="number" defaultValue={editingItem?.price} required />
                      <Input label="Stock" name="stock" type="number" defaultValue={editingItem?.stock} required />
                    </div>
                  </>
                ) : (
                  <>
                    <Input label="Full Name" name="name" required />
                    <Input label="Email" name="email" type="email" required />
                    <Input label="Phone" name="phone" required />
                  </>
                )}

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button"
                     onClick={() => { setModalType(null); setEditingItem(null); }}
                     className="flex-1 border-2 border-forma-ink py-4 text-[10px] font-black uppercase tracking-widest hover:bg-forma-ink hover:text-forma-bg"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 bg-forma-ink text-forma-bg py-4 text-[10px] font-black uppercase tracking-widest hover:bg-forma-accent border-2 border-forma-ink transition-colors"
                   >
                     Confirm
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</label>
      <input 
        className="w-full bg-transparent border-b-2 border-forma-ink py-2 font-black focus:outline-none focus:border-forma-accent transition-colors"
        {...props}
      />
    </div>
  );
}
