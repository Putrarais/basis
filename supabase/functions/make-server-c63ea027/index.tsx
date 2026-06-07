import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const getSupabaseAnon = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Init storage bucket
const BUCKET = 'make-c63ea027-products';
(async () => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET);
    }
  } catch (e) {
    console.log('Bucket init error:', e);
  }
})();

// Auth middleware
async function requireAuth(c: any, next: any) {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
}

app.get("/make-server-c63ea027/health", (c) => c.json({ status: "ok" }));

// SIGNUP
app.post("/make-server-c63ea027/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    const userId = data.user.id;
    await kv.set(`user:${userId}`, { id: userId, email, name, createdAt: new Date().toISOString() });
    await kv.set(`users:email:${email}`, userId);
    return c.json({ success: true, userId });
  } catch (e) {
    console.log('Signup error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// SIGNIN
app.post("/make-server-c63ea027/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: error.message }, 400);
    const userId = data.user.id;
    let profile = await kv.get(`user:${userId}`);
    if (!profile) {
      profile = { id: userId, email, name: data.user.user_metadata?.name || email.split('@')[0], createdAt: new Date().toISOString() };
      await kv.set(`user:${userId}`, profile);
    }
    return c.json({ success: true, token: data.session.access_token, user: profile });
  } catch (e) {
    console.log('Signin error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET current user profile
app.get("/make-server-c63ea027/auth/me", requireAuth, async (c) => {
  const userId = c.get('userId');
  const profile = await kv.get(`user:${userId}`);
  return c.json(profile || { id: userId, email: c.get('userEmail') });
});

// UPLOAD IMAGE
app.post("/make-server-c63ea027/upload", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return c.json({ error: 'No file provided' }, 400);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const supabase = getSupabaseAdmin();
    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
    });
    if (error) return c.json({ error: error.message }, 400);
    const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
    return c.json({ url: signedData?.signedUrl, path });
  } catch (e) {
    console.log('Upload error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET signed URL for image path
app.get("/make-server-c63ea027/image-url", async (c) => {
  const path = c.req.query('path');
  if (!path) return c.json({ error: 'No path' }, 400);
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  return c.json({ url: data?.signedUrl });
});

// ADD PRODUCT
app.post("/make-server-c63ea027/products", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const productId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const product = {
      id: productId,
      sellerId: userId,
      name: body.name,
      price: Number(body.price),
      stock: Number(body.stock),
      description: body.description || '',
      imagePath: body.imagePath || null,
      imageUrl: body.imageUrl || null,
      category: body.category || 'Umum',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`product:${productId}`, product);
    // Add to seller's list
    const sellerProducts: string[] = (await kv.get(`products:seller:${userId}`)) || [];
    sellerProducts.unshift(productId);
    await kv.set(`products:seller:${userId}`, sellerProducts);
    // Add to all products
    const allProducts: string[] = (await kv.get('products:all')) || [];
    allProducts.unshift(productId);
    await kv.set('products:all', allProducts);
    return c.json({ success: true, product });
  } catch (e) {
    console.log('Add product error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET ALL PRODUCTS (marketplace)
app.get("/make-server-c63ea027/products", async (c) => {
  try {
    const allIds: string[] = (await kv.get('products:all')) || [];
    const products = await Promise.all(
      allIds.map(id => kv.get(`product:${id}`))
    );
    const valid = products.filter(Boolean);
    // Enrich with seller name
    const sellerIds = [...new Set(valid.map((p: any) => p.sellerId))];
    const sellers = await Promise.all(sellerIds.map(id => kv.get(`user:${id}`)));
    const sellerMap: Record<string, any> = {};
    sellers.forEach((s: any) => { if (s) sellerMap[s.id] = s; });
    const enriched = valid.map((p: any) => ({ ...p, sellerName: sellerMap[p.sellerId]?.name || 'Penjual' }));
    return c.json(enriched);
  } catch (e) {
    console.log('Get products error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET SELLER PRODUCTS
app.get("/make-server-c63ea027/products/seller/:sellerId", async (c) => {
  try {
    const sellerId = c.req.param('sellerId');
    const ids: string[] = (await kv.get(`products:seller:${sellerId}`)) || [];
    const products = await Promise.all(ids.map(id => kv.get(`product:${id}`)));
    return c.json(products.filter(Boolean));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// UPDATE PRODUCT
app.put("/make-server-c63ea027/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = c.req.param('id');
    const existing: any = await kv.get(`product:${productId}`);
    if (!existing || existing.sellerId !== userId) return c.json({ error: 'Not authorized' }, 403);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id: productId, sellerId: userId };
    await kv.set(`product:${productId}`, updated);
    return c.json({ success: true, product: updated });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// DELETE PRODUCT
app.delete("/make-server-c63ea027/products/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const productId = c.req.param('id');
    const existing: any = await kv.get(`product:${productId}`);
    if (!existing || existing.sellerId !== userId) return c.json({ error: 'Not authorized' }, 403);
    await kv.del(`product:${productId}`);
    const sellerProducts: string[] = (await kv.get(`products:seller:${userId}`)) || [];
    await kv.set(`products:seller:${userId}`, sellerProducts.filter(id => id !== productId));
    const allProducts: string[] = (await kv.get('products:all')) || [];
    await kv.set('products:all', allProducts.filter(id => id !== productId));
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// CREATE ORDER
app.post("/make-server-c63ea027/orders", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const orderId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Validate and decrement stock
    const updatedItems = [];
    for (const item of body.items) {
      const product: any = await kv.get(`product:${item.productId}`);
      if (!product) return c.json({ error: `Produk ${item.productId} tidak ditemukan` }, 400);
      if (product.stock < item.quantity) return c.json({ error: `Stok ${product.name} tidak cukup` }, 400);
      await kv.set(`product:${item.productId}`, { ...product, stock: product.stock - item.quantity });
      updatedItems.push({ ...item, productName: product.name, productImage: product.imageUrl, sellerName: product.sellerName, sellerId: product.sellerId });
    }
    const order = {
      id: orderId,
      buyerId: userId,
      items: updatedItems,
      buyerName: body.buyerName,
      address: body.address,
      paymentMethod: body.paymentMethod,
      totalAmount: body.totalAmount,
      buktiPembayaranUrl: body.buktiPembayaranUrl || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`order:${orderId}`, order);
    // Add to buyer's orders
    const buyerOrders: string[] = (await kv.get(`orders:buyer:${userId}`)) || [];
    buyerOrders.unshift(orderId);
    await kv.set(`orders:buyer:${userId}`, buyerOrders);
    // Add to each seller's orders
    const sellerIds = [...new Set(updatedItems.map((i: any) => i.sellerId))];
    for (const sellerId of sellerIds) {
      const sellerOrders: string[] = (await kv.get(`orders:seller:${sellerId}`)) || [];
      sellerOrders.unshift(orderId);
      await kv.set(`orders:seller:${sellerId}`, sellerOrders);
    }
    return c.json({ success: true, order });
  } catch (e) {
    console.log('Create order error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET BUYER ORDERS
app.get("/make-server-c63ea027/orders/buyer", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const ids: string[] = (await kv.get(`orders:buyer:${userId}`)) || [];
    const orders = await Promise.all(ids.map(id => kv.get(`order:${id}`)));
    return c.json(orders.filter(Boolean));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// GET SELLER ORDERS
app.get("/make-server-c63ea027/orders/seller", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const ids: string[] = (await kv.get(`orders:seller:${userId}`)) || [];
    const orders = await Promise.all(ids.map(id => kv.get(`order:${id}`)));
    return c.json(orders.filter(Boolean));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// UPDATE ORDER STATUS
app.put("/make-server-c63ea027/orders/:id/status", requireAuth, async (c) => {
  try {
    const orderId = c.req.param('id');
    const { status } = await c.req.json();
    const order: any = await kv.get(`order:${orderId}`);
    if (!order) return c.json({ error: 'Order not found' }, 404);
    await kv.set(`order:${orderId}`, { ...order, status });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ADD RATING
app.post("/make-server-c63ea027/ratings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const ratingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user: any = await kv.get(`user:${userId}`);
    const rating = {
      id: ratingId,
      productId: body.productId,
      userId,
      userName: user?.name || 'Pengguna',
      stars: Number(body.stars),
      comment: body.comment || '',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`rating:${ratingId}`, rating);
    const productRatings: string[] = (await kv.get(`ratings:product:${body.productId}`)) || [];
    productRatings.unshift(ratingId);
    await kv.set(`ratings:product:${body.productId}`, productRatings);
    return c.json({ success: true, rating });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// GET PRODUCT RATINGS
app.get("/make-server-c63ea027/ratings/:productId", async (c) => {
  try {
    const productId = c.req.param('productId');
    const ids: string[] = (await kv.get(`ratings:product:${productId}`)) || [];
    const ratings = await Promise.all(ids.map(id => kv.get(`rating:${id}`)));
    return c.json(ratings.filter(Boolean));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// SAVE PAYMENT INFO (seller)
app.post("/make-server-c63ea027/payment-info", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const paymentInfo = {
      sellerId: userId,
      bankName: body.bankName || '',
      bankAccount: body.bankAccount || '',
      bankOwner: body.bankOwner || '',
      gopay: body.gopay || '',
      ovo: body.ovo || '',
      dana: body.dana || '',
      qrisUrl: body.qrisUrl || '',
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`payment-info:${userId}`, paymentInfo);
    return c.json({ success: true, paymentInfo });
  } catch (e) {
    console.log('Save payment info error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

// GET PAYMENT INFO (by seller ID)
app.get("/make-server-c63ea027/payment-info/:sellerId", async (c) => {
  try {
    const sellerId = c.req.param('sellerId');
    const paymentInfo = await kv.get(`payment-info:${sellerId}`);
    if (!paymentInfo) return c.json({ error: 'Not found' }, 404);
    return c.json(paymentInfo);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// GET ALL SELLERS (stores)
app.get("/make-server-c63ea027/stores", async (c) => {
  try {
    const allIds: string[] = (await kv.get('products:all')) || [];
    const products = await Promise.all(allIds.map(id => kv.get(`product:${id}`)));
    const sellerIds = [...new Set(products.filter(Boolean).map((p: any) => p.sellerId))];
    const sellers = await Promise.all(sellerIds.map(id => kv.get(`user:${id}`)));
    return c.json(sellers.filter(Boolean));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);
