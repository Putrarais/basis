import { useState, useEffect } from "react";
import { apiGet } from "./api";
import { Search, Star, ShoppingCart, Store, ChevronRight, Tag } from "lucide-react";

interface Props {
  token: string;
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onViewStore: (sellerId: string, sellerName: string) => void;
}

const CATEGORIES = ['Semua', 'Elektronik', 'Fashion', 'Makanan', 'Kecantikan', 'Rumah', 'Olahraga', 'Umum'];

export function Marketplace({ token, onProductClick, onAddToCart, onViewStore }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await apiGet('/products', token);
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sellerName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Semua' || p.category === category;
    return matchSearch && matchCat;
  });

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-primary to-violet-700 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Temukan Produk Terbaik</h2>
        <p className="text-purple-200 text-sm mb-5">Ribuan produk dari penjual terpercaya</p>
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk atau toko..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium shadow-lg"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${category === cat ? 'bg-primary text-white shadow-md shadow-purple-200' : 'bg-white text-muted-foreground border border-border hover:border-primary hover:text-primary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Produk tidak ditemukan</h3>
          <p className="text-muted-foreground text-sm">Coba kata kunci atau kategori lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onViewStore={onViewStore}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onProductClick, onAddToCart, onViewStore, formatPrice }: any) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:shadow-purple-100 hover:border-secondary transition-all group">
      <div className="relative h-44 bg-muted cursor-pointer" onClick={() => onProductClick(product)}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-foreground text-xs font-bold px-3 py-1 rounded-full">Habis</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full border border-border">{product.category}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 cursor-pointer hover:text-primary" onClick={() => onProductClick(product)}>{product.name}</h3>
        <button onClick={() => onViewStore(product.sellerId, product.sellerName)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
          <Store className="w-3 h-3" />
          <span className="truncate max-w-24">{product.sellerName}</span>
        </button>
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold text-sm">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full mt-3 py-2 bg-secondary text-primary rounded-xl text-xs font-semibold hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>
    </div>
  );
}
