import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiDelete, apiPut, uploadImage } from "./api";
import { Plus, Pencil, Trash2, Package, ImagePlus, Share2, Check, X, Tag, CreditCard, Save, QrCode, Smartphone, Building2 } from "lucide-react";

interface Props {
  token: string;
  user: any;
}

const CATEGORIES = ['Umum', 'Elektronik', 'Fashion', 'Makanan', 'Kecantikan', 'Rumah', 'Olahraga'];

export function MyStore({ token, user }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', description: '', category: 'Umum', imagePath: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pengaturan pembayaran
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    bankName: '', bankAccount: '', bankOwner: '',
    gopay: '', ovo: '', dana: '',
    qrisUrl: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const qrisRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); loadPaymentInfo(); }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await apiGet(`/products/seller/${user.id}`, token);
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadPaymentInfo() {
    try {
      const data = await apiGet(`/payment-info/${user.id}`, token);
      if (data && !data.error) setPaymentInfo(data);
    } catch {}
  }

  async function savePaymentInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await apiPost('/payment-info', { ...paymentInfo }, token);
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 2500);
    } catch {}
    finally { setSavingPayment(false); }
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQris(true);
    try {
      const res = await uploadImage(file, token);
      if (res.url) setPaymentInfo(prev => ({ ...prev, qrisUrl: res.url }));
    } finally { setUploadingQris(false); }
  }

  function openForm(product?: any) {
    if (product) {
      setEditProduct(product);
      setForm({ name: product.name, price: String(product.price), stock: String(product.stock), description: product.description || '', category: product.category || 'Umum', imagePath: product.imagePath || '', imageUrl: product.imageUrl || '' });
      setImagePreview(product.imageUrl || '');
    } else {
      setEditProduct(null);
      setForm({ name: '', price: '', stock: '', description: '', category: 'Umum', imagePath: '', imageUrl: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setShowForm(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let imagePath = form.imagePath;
      let imageUrl = form.imageUrl;
      if (imageFile) {
        setUploading(true);
        const res = await uploadImage(imageFile, token);
        if (res.url) { imageUrl = res.url; imagePath = res.path; }
        setUploading(false);
      }
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), imagePath, imageUrl };
      if (editProduct) {
        await apiPut(`/products/${editProduct.id}`, payload, token);
      } else {
        await apiPost('/products', payload, token);
      }
      await loadProducts();
      setShowForm(false);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return;
    await apiDelete(`/products/${id}`, token);
    await loadProducts();
  }

  function shareStore() {
    const url = `${window.location.origin}?store=${user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Toko Saya</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} produk aktif</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setShowPaymentSettings(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-muted transition-all">
            <CreditCard className="w-4 h-4 text-primary" />
            Info Pembayaran
          </button>
          <button onClick={shareStore} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground hover:bg-muted transition-all">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Bagikan Toko'}
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-purple-200">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Modal Info Pembayaran */}
      {showPaymentSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <CreditCard className="w-5 h-5 text-primary" />
                Pengaturan Info Pembayaran
              </h2>
              <button onClick={() => setShowPaymentSettings(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={savePaymentInfo} className="p-6 space-y-6">

              {/* Transfer Bank */}
              <div>
                <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Transfer Bank
                </h3>
                <div className="space-y-3">
                  <input value={paymentInfo.bankName} onChange={e => setPaymentInfo(p => ({ ...p, bankName: e.target.value }))} placeholder="Nama Bank (contoh: BCA, BRI, Mandiri)" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  <input value={paymentInfo.bankAccount} onChange={e => setPaymentInfo(p => ({ ...p, bankAccount: e.target.value }))} placeholder="Nomor Rekening" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  <input value={paymentInfo.bankOwner} onChange={e => setPaymentInfo(p => ({ ...p, bankOwner: e.target.value }))} placeholder="Nama Pemilik Rekening" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
              </div>

              {/* GoPay / OVO / Dana */}
              <div>
                <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-500" />
                  Dompet Digital
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 w-12">GoPay</span>
                    <input value={paymentInfo.gopay} onChange={e => setPaymentInfo(p => ({ ...p, gopay: e.target.value }))} placeholder="Nomor HP GoPay" className="w-full pl-16 pr-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600 w-12">OVO</span>
                    <input value={paymentInfo.ovo} onChange={e => setPaymentInfo(p => ({ ...p, ovo: e.target.value }))} placeholder="Nomor HP OVO" className="w-full pl-16 pr-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 w-12">Dana</span>
                    <input value={paymentInfo.dana} onChange={e => setPaymentInfo(p => ({ ...p, dana: e.target.value }))} placeholder="Nomor HP Dana" className="w-full pl-16 pr-4 py-3 rounded-xl bg-gray-50 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                </div>
              </div>

              {/* QRIS */}
              <div>
                <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  QRIS
                </h3>
                {paymentInfo.qrisUrl ? (
                  <div className="relative inline-block">
                    <img src={paymentInfo.qrisUrl} alt="QRIS" className="w-40 h-40 object-contain rounded-xl border border-border bg-gray-50" />
                    <button type="button" onClick={() => setPaymentInfo(p => ({ ...p, qrisUrl: '' }))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-green-600 font-semibold mt-2">✓ QR Code terpasang</p>
                  </div>
                ) : (
                  <div onClick={() => qrisRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-all">
                    {uploadingQris ? (
                      <p className="text-sm text-muted-foreground">Mengupload...</p>
                    ) : (
                      <>
                        <QrCode className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">Upload foto QR Code QRIS</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, maks 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={qrisRef} type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentSettings(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all">
                  Batal
                </button>
                <button type="submit" disabled={savingPayment} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-purple-200">
                  {paymentSaved ? <><Check className="w-4 h-4" /> Tersimpan!</> : savingPayment ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Foto Produk</label>
                <div onClick={() => fileRef.current?.click()} className="w-full h-44 rounded-xl border-2 border-dashed border-border bg-muted cursor-pointer hover:border-primary transition-all flex items-center justify-center overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Klik untuk upload foto</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Nama Produk *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Harga (Rp) *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Stok *</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk (opsional)" rows={3} className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-md shadow-purple-200">
                  {uploading ? 'Mengupload...' : saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products grid */}
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
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Belum ada produk</h3>
          <p className="text-muted-foreground text-sm mb-6">Mulai tambahkan produk untuk dijual</p>
          <button onClick={() => openForm()} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all">Tambah Produk Pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-md transition-all">
              <div className="relative h-44 bg-muted">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2"><span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Habis</span></div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-primary font-bold text-sm">{formatPrice(product.price)}</span>
                  <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openForm(product)} className="flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-secondary text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all">
                    <Pencil className="w-3 h-3" />Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="w-3 h-3" />Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
