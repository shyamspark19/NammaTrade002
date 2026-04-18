import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, Loader2, PackageSearch, Store, AlertTriangle, Tag, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

export default function ConsumerShop() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const autoItemId = searchParams.get('item');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [purchasingItem, setPurchasingItem] = useState<any>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchShopData(); }, []);
  useEffect(() => { if (user?.id) fetchWishlist(); }, [user]);

  const fetchWishlist = async () => {
    const { data } = await (supabase.from('wishlist' as any) as any)
      .select('vendor_inventory_id')
      .eq('user_id', user?.id);
    if (data) setWishlistIds(new Set(data.map((w: any) => w.vendor_inventory_id)));
  };

  const toggleWishlist = async (product: any) => {
    if (!user?.id) return;
    setTogglingId(product.id);
    const isSaved = wishlistIds.has(product.id);
    try {
      if (isSaved) {
        await (supabase.from('wishlist' as any) as any)
          .delete()
          .eq('user_id', user.id)
          .eq('vendor_inventory_id', product.id);
        setWishlistIds(prev => { const s = new Set(prev); s.delete(product.id); return s; });
        toast.success('Removed from Wishlist');
      } else {
        await (supabase.from('wishlist' as any) as any)
          .insert({ user_id: user.id, vendor_inventory_id: product.id, product_id: product.product_id });
        setWishlistIds(prev => new Set([...prev, product.id]));
        toast.success('Added to Wishlist ❤️');
      }
    } catch (e: any) {
      toast.error('Wishlist update failed: ' + e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('vendor_inventory' as any) as any)
        .select(`
          id, retail_price, stock, vendor_id,
          profiles!vendor_inventory_vendor_id_fkey ( full_name, email ),
          products ( id, name, category, retail_mrp )
        `)
        .eq('status', 'active')
        .gt('stock', 0);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => {
        const mrp = Number(item.products?.retail_mrp || 0);
        const price = Number(item.retail_price || 0);
        const discPct = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
        return {
          id: item.id,
          vendor_id: item.vendor_id,
          vendor_name: item.profiles?.full_name || item.profiles?.email || 'Unknown Vendor',
          product_id: item.products?.id,
          name: item.products?.name,
          category: item.products?.category,
          price,
          mrp: mrp > price ? mrp : null,
          discPct,
          stock: Number(item.stock)
        };
      });

      setProducts(formatted);
      const uniqueCats = ['All', ...Array.from(new Set(formatted.map(f => f.category).filter(Boolean)))];
      setCategories(uniqueCats as string[]);

      // Auto-open buy modal if ?item= param present
      if (autoItemId) {
        const target = formatted.find(p => p.id === autoItemId);
        if (target) {
          setPurchaseQty(1);
          setPurchasingItem(target);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load shop: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !purchasingItem) return;
    setIsSubmitting(true);
    try {
      if (purchaseQty > purchasingItem.stock) throw new Error(`Only ${purchasingItem.stock} items left.`);

      const orderTotal = purchasingItem.price * purchaseQty;
      const { error: orderError } = await (supabase.from('orders' as any) as any).insert({
        seller_id: purchasingItem.vendor_id,
        buyer_id: user.id,
        product_id: purchasingItem.product_id,
        order_type: 'retail',
        quantity: purchaseQty,
        total_price: orderTotal,
        status: 'pending'
      });
      if (orderError) throw orderError;

      const { error: stockError } = await (supabase.from('vendor_inventory' as any) as any)
        .update({ stock: purchasingItem.stock - purchaseQty })
        .eq('id', purchasingItem.id);
      if (stockError) throw stockError;

      toast.success(`Ordered ${purchaseQty}× ${purchasingItem.name}! Check My Orders.`);
      setPurchasingItem(null);
      setPurchaseQty(1);
      fetchShopData();
    } catch (err: any) {
      toast.error('Checkout failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.vendor_name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortOrder === 'low-high') return a.price - b.price;
      if (sortOrder === 'high-low') return b.price - a.price;
      if (sortOrder === 'discount') return b.discPct - a.discPct;
      return 0;
    });

  const savedAmount = purchasingItem?.mrp
    ? ((purchasingItem.mrp - purchasingItem.price) * purchaseQty).toFixed(2)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Shop</h1>
          <p className="text-muted-foreground mt-1">Discover live products from verified local vendors</p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or vendors..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="low-high">Price: Low to High</SelectItem>
              <SelectItem value="high-low">Price: High to Low</SelectItem>
              <SelectItem value="discount">Best Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={cat === activeCategory ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Purchase Modal */}
        {purchasingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-sm shadow-xl border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2 text-xs">{purchasingItem.category}</Badge>
                  <h3 className="font-bold text-lg leading-tight">{purchasingItem.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Store className="h-3.5 w-3.5" /> {purchasingItem.vendor_name}
                  </p>
                </div>
                <form onSubmit={handleBuyNow} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Quantity <span className="text-muted-foreground text-xs">(Max: {purchasingItem.stock})</span></Label>
                    <Input
                      type="number" min="1" max={purchasingItem.stock} required
                      value={purchaseQty}
                      onChange={e => setPurchaseQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Unit Price</span><span>₹{purchasingItem.price} × {purchaseQty}</span>
                    </div>
                    {savedAmount && Number(savedAmount) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>You Save</span><span>−₹{savedAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
                      <span>Total</span>
                      <span className="text-primary">₹{(purchasingItem.price * purchaseQty).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setPurchasingItem(null)}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Order'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg">
            <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium">No products available</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const isSaved = wishlistIds.has(product.id);
              const isToggling = togglingId === product.id;

              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all overflow-hidden flex flex-col relative">
                  {/* Discount badge */}
                  {product.discPct > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                        <Tag className="h-2.5 w-2.5" /> {product.discPct}% OFF
                      </Badge>
                    </div>
                  )}

                  {/* Heart / Wishlist button — top right */}
                  <button
                    onClick={() => toggleWishlist(product)}
                    disabled={isToggling}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow hover:scale-110 transition-transform"
                    title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${isSaved ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
                    />
                  </button>

                  {/* Low stock warning */}
                  {product.stock <= 5 && (
                    <div className="absolute top-10 right-2 z-10">
                      <Badge className="bg-warning text-warning-foreground text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> {product.stock} left
                      </Badge>
                    </div>
                  )}

                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center border-b border-muted">
                    <Store className="h-12 w-12 text-muted-foreground/30" />
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate flex-1">{product.vendor_name}</p>
                      <Badge variant="outline" className="text-[9px] px-1.5 ml-1 flex-shrink-0">{product.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 flex-1">{product.name}</h3>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-bold text-lg text-primary">₹{product.price}</span>
                      {product.mrp && <span className="text-sm text-muted-foreground line-through">₹{product.mrp}</span>}
                    </div>
                    <Button size="sm" className="w-full gap-2 mt-1" onClick={() => { setPurchaseQty(1); setPurchasingItem(product); }}>
                      <ShoppingCart className="h-4 w-4" /> Buy Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
