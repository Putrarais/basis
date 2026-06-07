import { useState, useEffect } from "react";
import { apiGet } from "./api";
import { ArrowLeft, Store, ShoppingCart, Tag } from "lucide-react";

interface Props {
  sellerId: string;
  sellerName: string;
  token: string;
  onBack: () => void;
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
}

export function StoreView({ sellerId, sellerName, token, onBack, onProductClick, onAddToCart }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await apiGet(`/products/seller/${sellerId}`, token);
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, [sellerId]);

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Store header */}
      <div className="bg-gradient-to-br from-primary to-violet-700 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 border-white/30">
            {sellerName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-purple-200" />
              <span className="text-purple-200 text-sm">Toko</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{sellerName}</h1>
            <p className="text-purple-200 text-sm">{products.length} produk tersedia</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl animate-pulse">
              <div className="h-44 bg-muted rounded-t-2xl" />
              <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded" /><div className="h-3 bg-muted rounded w-2/3" /></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Store className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Toko ini belum memiliki produk</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:shadow-purple-100 transition-all group">
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
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2 cursor-pointer hover:text-primary" onClick={() => onProductClick(product)}>{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-primary font-bold text-sm">{formatPrice(product.price)}</span>
                  <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                </div>
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full py-2 bg-secondary text-primary rounded-xl text-xs font-semibold hover:bg-primary hover:text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
