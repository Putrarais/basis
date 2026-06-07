import { useState, useEffect } from "react";
import { apiGet } from "./api";
import { Package, Clock, CheckCircle, Truck, XCircle, Star, Tag } from "lucide-react";

interface Props {
  token: string;
  user: any;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Menunggu', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  processing: { label: 'Diproses', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  shipped: { label: 'Dikirim', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  delivered: { label: 'Selesai', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export function Orders({ token, user }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => { loadOrders(); }, [tab]);

  async function loadOrders() {
    setLoading(true);
    const data = await apiGet(`/orders/${tab}`, token);
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function formatPrice(p: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Pesanan</h1>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 mb-6">
        {[
          { id: 'buyer' as const, label: 'Pembelian Saya' },
          { id: 'seller' as const, label: 'Penjualan Toko' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded mb-4 w-1/3" />
              <div className="h-3 bg-muted rounded mb-2 w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            {tab === 'buyer' ? 'Belum ada pembelian' : 'Belum ada penjualan'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {tab === 'buyer' ? 'Mulai belanja dan pesanan Anda akan muncul di sini' : 'Pesanan dari pembeli akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">ID Pesanan</p>
                    <p className="font-mono text-xs font-semibold text-foreground">{order.id.slice(0, 20)}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.sellerName}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(item.price)}</p>
                      </div>
                      <p className="font-bold text-sm text-foreground">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/20">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{tab === 'seller' ? 'Pembeli' : 'Penerima'}: <span className="font-semibold text-foreground">{order.buyerName}</span></p>
                      <p className="text-xs text-muted-foreground">Pembayaran: <span className="font-semibold text-foreground">{order.paymentMethod}</span></p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                      <p className="font-bold text-lg text-primary">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold">Alamat: </span>{order.address}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
