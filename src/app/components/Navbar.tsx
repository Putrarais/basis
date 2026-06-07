import { ShoppingBag, Store, ShoppingCart, Package, LogOut, Star, Home } from "lucide-react";

interface Props {
  user: any;
  cartCount: number;
  view: string;
  onNav: (v: string) => void;
  onLogout: () => void;
}

export function Navbar({ user, cartCount, view, onNav, onLogout }: Props) {
  const navItems = [
    { id: 'marketplace', label: 'Belanja', icon: Home },
    { id: 'mystore', label: 'Toko Saya', icon: Store },
    { id: 'orders', label: 'Pesanan', icon: Package },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => onNav('marketplace')} className="flex items-center gap-2 font-bold text-xl text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          PUHARIFEA
        </button>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === id ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNav('cart')}
            className="relative p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-foreground max-w-24 truncate">{user?.name}</span>
            <button onClick={onLogout} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all" title="Keluar">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-border">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNav(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold transition-all ${view === id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
        <button onClick={() => onNav('cart')} className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold relative transition-all ${view === 'cart' ? 'text-primary' : 'text-muted-foreground'}`}>
          <ShoppingCart className="w-5 h-5" />
          Keranjang
          {cartCount > 0 && <span className="absolute top-1.5 right-4 w-4 h-4 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center justify-center">{cartCount}</span>}
        </button>
      </div>
    </nav>
  );
}
