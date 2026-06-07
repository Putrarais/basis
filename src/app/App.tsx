import { useState, useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { Navbar } from "./components/Navbar";
import { Marketplace } from "./components/Marketplace";
import { MyStore } from "./components/MyStore";
import { ProductDetail } from "./components/ProductDetail";
import { Cart } from "./components/Cart";
import { Orders } from "./components/Orders";
import { StoreView } from "./components/StoreView";

{/* MARKER-MAKE-KIT-INVOKED */}

type View = 'marketplace' | 'mystore' | 'cart' | 'orders' | 'product' | 'store';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<View>('marketplace');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string } | null>(null);
  const [prevView, setPrevView] = useState<View>('marketplace');

  // Persist auth
  useEffect(() => {
    const savedToken = localStorage.getItem('tokoku_token');
    const savedUser = localStorage.getItem('tokoku_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    const savedCart = localStorage.getItem('tokoku_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  function handleLogin(userData: any, userToken: string) {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('tokoku_token', userToken);
    localStorage.setItem('tokoku_user', JSON.stringify(userData));
    setView('marketplace');
  }

  function handleLogout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tokoku_token');
    localStorage.removeItem('tokoku_user');
  }

  function addToCart(product: any) {
    const newCart = [...cart, product];
    setCart(newCart);
    localStorage.setItem('tokoku_cart', JSON.stringify(newCart));
  }

  function updateCart(newCart: any[]) {
    setCart(newCart);
    localStorage.setItem('tokoku_cart', JSON.stringify(newCart));
  }

  function handleProductClick(product: any) {
    setSelectedProduct(product);
    setPrevView(view);
    setView('product');
  }

  function handleViewStore(sellerId: string, sellerName: string) {
    setSelectedStore({ id: sellerId, name: sellerName });
    setPrevView(view);
    setView('store');
  }

  function handleBack() {
    setView(prevView || 'marketplace');
  }

  function handleNav(v: string) {
    setView(v as View);
  }

  if (!user || !token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        cartCount={cart.length}
        view={view}
        onNav={handleNav}
        onLogout={handleLogout}
      />

      <main>
        {view === 'marketplace' && (
          <Marketplace
            token={token}
            onProductClick={handleProductClick}
            onAddToCart={addToCart}
            onViewStore={handleViewStore}
          />
        )}
        {view === 'mystore' && (
          <MyStore token={token} user={user} />
        )}
        {view === 'cart' && (
          <Cart
            cart={cart}
            token={token}
            user={user}
            onUpdate={updateCart}
            onOrderSuccess={() => setView('orders')}
          />
        )}
        {view === 'orders' && (
          <Orders token={token} user={user} />
        )}
        {view === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            token={token}
            user={user}
            onBack={handleBack}
            onAddToCart={addToCart}
            onViewStore={handleViewStore}
          />
        )}
        {view === 'store' && selectedStore && (
          <StoreView
            sellerId={selectedStore.id}
            sellerName={selectedStore.name}
            token={token}
            onBack={handleBack}
            onProductClick={handleProductClick}
            onAddToCart={addToCart}
          />
        )}
      </main>
    </div>
  );
}
