import { useState, useEffect } from "react";
import { apiGet, apiPost } from "./api";
import { ArrowLeft, Star, ShoppingCart, Store, Package, MessageCircle, Send, Tag } from "lucide-react";

interface Props {
  product: any;
  token: string;
  user: any;
  onBack: () => void;
  onAddToCart: (product: any) => void;
  onViewStore: (sellerId: string, sellerName: string) => void;
}

export function ProductDetail({ product, token, user, onBack, onAddToCart, onViewStore }: Props) {
  const [ratings, setRatings] = useState<any[]>([]);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => { loadRatings(); }, [product.id]);

  async function loadRatings() {
    const data = await apiGet(`/ratings/${product.id}`, token);
    setRatings(Array.isArray(data) ? data : []);
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await apiPost('/ratings', { productId: product.id, stars, comment }, token);
    setComment('');
    setStars(5);
    await loadRatings();
    setSubmitting(false);
  }

  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : '0.0';

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="h-72 md:h-auto bg-muted flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Tag className="w-24 h-24 text-muted-foreground/20" />
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{product.name}</h1>
              <span className="flex-shrink-0 px-3 py-1 bg-secondary text-primary text-xs font-semibold rounded-full">{product.category}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{avgRating}</span>
              <span className="text-sm text-muted-foreground">({ratings.length} ulasan)</span>
            </div>

            <div className="text-3xl font-bold text-primary mb-4">{formatPrice(product.price)}</div>

            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Stok: <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{product.stock} tersedia</span></span>
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>
            )}

            <button onClick={() => onViewStore(product.sellerId, product.sellerName)} className="flex items-center gap-2 text-sm text-primary hover:underline mb-6 font-semibold w-fit">
              <Store className="w-4 h-4" />
              {product.sellerName}
            </button>

            <div className="mt-auto space-y-3">
              {/* Qty selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">Jumlah:</span>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg bg-white font-bold text-foreground hover:bg-secondary transition-all flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-semibold text-sm">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-8 h-8 rounded-lg bg-white font-bold text-foreground hover:bg-secondary transition-all flex items-center justify-center">+</button>
                </div>
              </div>
              <button
                onClick={() => { for (let i = 0; i < qty; i++) onAddToCart(product); }}
                disabled={product.stock === 0}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-200"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings section */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Ulasan Produk
        </h2>

        {/* Add rating form */}
        <form onSubmit={submitRating} className="bg-muted rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-foreground mb-3">Tulis ulasan Anda</p>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverStar(s)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setStars(s)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`w-7 h-7 ${s <= (hoverStar || stars) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-gray-300'}`} />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground font-medium">{['', 'Sangat buruk', 'Buruk', 'Cukup', 'Bagus', 'Sangat bagus'][hoverStar || stars]}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tulis komentar (opsional)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
              <Send className="w-4 h-4" />
              {submitting ? '...' : 'Kirim'}
            </button>
          </div>
        </form>

        {/* Ratings list */}
        {ratings.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada ulasan. Jadilah yang pertama!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map(r => (
              <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      {r.userName?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-foreground">{r.userName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 mb-1.5 ml-10">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-foreground ml-10">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
