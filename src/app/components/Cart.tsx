import { useState, useRef, useEffect } from "react";
import { apiPost, apiGet } from "./api";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, MapPin, CreditCard, Tag, CheckCircle, Upload, ImageIcon, X, Building2, Smartphone, QrCode, Copy, Check } from "lucide-react";
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Props {
  cart: any[];
  token: string;
  user: any;
  onUpdate: (cart: any[]) => void;
  onOrderSuccess: () => void;
}

const PAYMENT_METHODS = ['Transfer Bank', 'QRIS', 'COD (Bayar di Tempat)', 'GoPay', 'OVO', 'Dana'];
const TRANSFER_METHODS = ['Transfer Bank', 'QRIS', 'GoPay', 'OVO', 'Dana'];

export function Cart({ cart, token, user, onUpdate, onOrderSuccess }: Props) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedText, setCopiedText] = useState('');

  // Info pembayaran seller
  const [sellerPaymentInfo, setSellerPaymentInfo] = useState<any>(null);

  // Bukti pembayaran
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [uploadingBukti, setUploadingBukti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped = cart.reduce((acc: Record<string, { product: any; qty: number }>, product: any) => {
    const key = product.id;
    if (!acc[key]) acc[key] = { product, qty: 0 };
    acc[key].qty += 1;
    return acc;
  }, {});
  const groupedItems = Object.values(grouped);
  const total = groupedItems.reduce((s, { product, qty }) => s + product.price * qty, 0);

  // Ambil seller ID dari produk di keranjang
  const sellerIdFromCart = groupedItems[0]?.product?.sellerId;

  useEffect(() => {
    if (sellerIdFromCart) {
      apiGet(`/payment-info/${sellerIdFromCart}`, token).then(data => {
        if (data && !data.error) setSellerPaymentInfo(data);
      });
    }
  }, [sellerIdFromCart]);

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  }

  function updateQty(productId: string, delta: number) {
    const newCart = [...cart];
    const idx = newCart.findIndex(p => p.id === productId);
    if (delta < 0) { newCart.splice(idx, 1); } else { newCart.push(newCart[idx]); }
    onUpdate(newCart);
  }

  function removeItem(productId: string) { onUpdate(cart.filter(p => p.id !== productId)); }

  function handleBuktiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file maksimal 5MB'); return; }
    setBuktiFile(file);
    setBuktiPreview(URL.createObjectURL(file));
    setError('');
  }

  function removeBukti() {
    setBuktiFile(null);
    setBuktiPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadBukti(): Promise<string | null> {
    if (!buktiFile) return null;
    setUploadingBukti(true);
    try {
      const formData = new FormData();
      formData.append('file', buktiFile);
      const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-c63ea027`;
      const res = await fetch(`${BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      return data.url || null;
    } catch { return null; }
    finally { setUploadingBukti(false); }
  }

  const needsBukti = TRANSFER_METHODS.includes(paymentMethod);

  // Tampilkan info rekening sesuai metode pembayaran yang dipilih
  function renderPaymentDetail() {
    if (!sellerPaymentInfo) return null;
    const p = sellerPaymentInfo;

    if (paymentMethod === 'Transfer Bank' && p.bankAccount) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Info Rekening Bank</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bank</span>
              <span className="text-sm font-bold text-foreground">{p.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">No. Rekening</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{p.bankAccount}</span>
                <button type="button" onClick={() => copyText(p.bankAccount, 'rek')} className="p-1 rounded-lg hover:bg-blue-100 transition-all">
                  {copiedText === 'rek' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Atas Nama</span>
              <span className="text-sm font-bold text-foreground">{p.bankOwner}</span>
            </div>
          </div>
        </div>
      );
    }

    if (paymentMethod === 'QRIS' && p.qrisUrl) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5 mb-3"><QrCode className="w-3.5 h-3.5" />Scan QR Code QRIS</p>
          <img src={p.qrisUrl} alt="QRIS" className="w-48 h-48 object-contain mx-auto rounded-xl border border-orange-200 bg-white p-2" />
        </div>
      );
    }

    if (paymentMethod === 'GoPay' && p.gopay) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1.5 mb-2"><Smartphone className="w-3.5 h-3.5" />Nomor GoPay</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">{p.gopay}</span>
            <button type="button" onClick={() => copyText(p.gopay, 'gopay')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 transition-all text-xs font-semibold text-green-700">
              {copiedText === 'gopay' ? <><Check className="w-3 h-3" /> Tersalin</> : <><Copy className="w-3 h-3" /> Salin</>}
            </button>
          </div>
        </div>
      );
    }

    if (paymentMethod === 'OVO' && p.ovo) {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5 mb-2"><Smartphone className="w-3.5 h-3.5" />Nomor OVO</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">{p.ovo}</span>
            <button type="button" onClick={() => copyText(p.ovo, 'ovo')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 transition-all text-xs font-semibold text-purple-700">
              {copiedText === 'ovo' ? <><Check className="w-3 h-3" /> Tersalin</> : <><Copy className="w-3 h-3" /> Salin</>}
            </button>
          </div>
        </div>
      );
    }

    if (paymentMethod === 'Dana' && p.dana) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5 mb-2"><Smartphone className="w-3.5 h-3.5" />Nomor Dana</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">{p.dana}</span>
            <button type="button" onClick={() => copyText(p.dana, 'dana')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-all text-xs font-semibold text-blue-700">
              {copiedText === 'dana' ? <><Check className="w-3 h-3" /> Tersalin</> : <><Copy className="w-3 h-3" /> Salin</>}
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (needsBukti && !buktiFile) { setError('Harap upload bukti pembayaran terlebih dahulu.'); return; }
    setLoading(true);
    setError('');
    try {
      let buktiUrl: string | null = null;
      if (buktiFile) {
        buktiUrl = await uploadBukti();
        if (!buktiUrl) { setError('Gagal mengupload bukti pembayaran. Coba lagi.'); setLoading(false); return; }
      }
      const items = groupedItems.map(({ product, qty }) => ({ productId: product.id, quantity: qty, price: product.price }));
      const res = await apiPost('/orders', { items, buyerName, address, paymentMethod, totalAmount: total, buktiPembayaranUrl: buktiUrl }, token);
      if (res.error) { setError(res.error); return; }
      onUpdate([]);
      setStep('success');
    } catch { setError('Gagal membuat pesanan. Coba lagi.'); }
    finally { setLoading(false); }
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Pesanan Berhasil!</h2>
        <p className="text-muted-foreground text-sm mb-8">Pesanan Anda telah diterima dan sedang diproses oleh penjual.</p>
        <button onClick={onOrderSuccess} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-md shadow-purple-200">Lihat Pesanan Saya</button>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => setStep('cart')} className="text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 transition-colors">← Kembali ke Keranjang</button>
        <h1 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Checkout</h1>

        <form onSubmit={placeOrder} className="space-y-5">
          {/* Informasi Pengiriman */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Informasi Pengiriman</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Nama Penerima *</label>
                <input required value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nama lengkap penerima" className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Alamat Lengkap *</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos" rows={3} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PAYMENT_METHODS.map(method => (
                <button key={method} type="button" onClick={() => { setPaymentMethod(method); removeBukti(); setError(''); }}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === method ? 'border-primary bg-secondary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {method}
                </button>
              ))}
            </div>

            {/* Info rekening/nomor seller */}
            {needsBukti && renderPaymentDetail()}
            {needsBukti && !renderPaymentDetail() && sellerPaymentInfo !== null && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Penjual belum mengisi info pembayaran untuk metode ini.
              </p>
            )}
          </div>

          {/* Upload Bukti Pembayaran */}
          {needsBukti && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Bukti Pembayaran <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Setelah transfer, upload screenshot/foto bukti pembayaran Anda.</p>

              {buktiPreview ? (
                <div className="relative">
                  <img src={buktiPreview} alt="Bukti Pembayaran" className="w-full max-h-64 object-contain rounded-xl border border-border bg-muted" />
                  <button type="button" onClick={removeBukti} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-md">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {buktiFile?.name}</p>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">Klik untuk upload bukti transfer</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, maksimal 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBuktiChange} className="hidden" />
            </div>
          )}

          {/* Ringkasan Pesanan */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-2 mb-4">
              {groupedItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{product.name} × {qty}</span>
                  <span className="font-semibold">{formatPrice(product.price * qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-xl text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <button type="submit" disabled={loading || uploadingBukti} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-60 shadow-md shadow-purple-200 flex items-center justify-center gap-2">
            {loading || uploadingBukti ? 'Memproses...' : `Bayar ${formatPrice(total)}`}
            {!loading && !uploadingBukti && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <ShoppingCart className="w-6 h-6 text-primary" />Keranjang Belanja
      </h1>
      {groupedItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Keranjang kosong</h3>
          <p className="text-muted-foreground text-sm">Tambahkan produk dari toko untuk mulai belanja</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border divide-y divide-border">
            {groupedItems.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag className="w-8 h-8 text-muted-foreground/30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
                  <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-all"><Minus className="w-3 h-3 text-foreground" /></button>
                    <span className="w-6 text-center font-bold text-sm">{qty}</span>
                    <button onClick={() => updateQty(product.id, 1)} disabled={qty >= product.stock} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-40"><Plus className="w-3 h-3 text-foreground" /></button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-foreground">{formatPrice(product.price * qty)}</span>
                  <button onClick={() => removeItem(product.id)} className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Subtotal ({cart.length} item)</span>
              <span className="font-bold text-xl text-primary">{formatPrice(total)}</span>
            </div>
            <button onClick={() => setStep('checkout')} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2">
              Lanjut ke Checkout<ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
