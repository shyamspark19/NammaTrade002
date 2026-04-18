import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, Loader2, Package, Store, Info, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function VendorMaterialShop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [purchasingItem, setPurchasingItem] = useState<any>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Direct discovery: Fetch who has what stock. 
      // Vendors have RLS permission to view the inventory table.
      const { data, error } = await (supabase.from('inventory' as any) as any)
        .select(`
          warehouse_id,
          quantity,
          products (*)
        `)
        .gt('quantity', 0);

      if (error) throw error;
      
      // Flatten the data: include the warehouse_id in each product card
      const flattened = (data || []).map((item: any) => ({
        ...item.products,
        warehouse_id: item.warehouse_id,
        warehouse_stock: item.quantity
      }));
      
      setProducts(flattened);
    } catch (err: any) {
      toast.error('Failed to load material catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !purchasingItem) return;
    
    setIsSubmitting(true);
    try {
      const orderType = purchaseQty > 40 ? 'wholesale' : 'retail';
      const orderTotal = purchasingItem.wholesale_price * purchaseQty;

      // 1. Place the procurement request with the specific warehouse that owns this stock
      const { error: orderError } = await (supabase.from('orders' as any) as any).insert({
        seller_id: purchasingItem.warehouse_id,
        buyer_id: user.id,
        product_id: purchasingItem.id,
        order_type: orderType,
        quantity: purchaseQty,
        total_price: orderTotal,
        status: 'pending'
      });

      if (orderError) throw orderError;

      toast.success(`Procurement request sent! Awaiting warehouse approval.`, {
        action: {
          label: 'View Orders',
          onClick: () => navigate('/vendor/orders')
        }
      });
      setPurchasingItem(null);
      setPurchaseQty(1);
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      toast.error('Procurement failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">Material Procurement</h1>
            <p className="text-muted-foreground mt-1">Bulk and retail material sourcing for your inventory</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-secondary/30">
            <Info className="h-4 w-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-secondary-foreground">
              Orders &gt; 40 units are categorized as Wholesale
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search materials..." 
            className="pl-10 h-10 shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-medium">Catalog empty or no match</h3>
            <p className="text-muted-foreground mt-1">Check back later for new materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <Card key={item.id} className="group hover:shadow-xl transition-all border-primary/5 overflow-hidden flex flex-col">
                <div className="h-32 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border-b border-primary/5">
                  <Package className="h-12 w-12 text-primary/30 group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0">
                      {item.category}
                    </Badge>
                    <Badge variant={item.warehouse_stock > 0 ? 'outline' : 'destructive'} className="text-[9px]">
                      {item.warehouse_stock || 0} in warehouse
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-1 leading-tight">{item.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {item.description || 'Global material for retail distribution.'}
                  </p>
                  
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Bulk Price</span>
                        <span className="text-xl font-bold text-primary">₹{item.wholesale_price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Retail MRP</span>
                        <p className="text-sm font-medium">₹{item.retail_mrp}</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full gap-2 font-semibold shadow-lg shadow-primary/20" 
                      onClick={() => { setPurchaseQty(1); setPurchasingItem(item); }}
                    >
                      <ShoppingCart className="h-4 w-4" /> Procure Material
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        {purchasingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <Card className="w-full max-w-sm shadow-2xl border-primary/20 animate-in zoom-in-95 duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Procure Material</CardTitle>
                <CardDescription>Ordering {purchasingItem.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handlePurchase} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Quantity to Procure</Label>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        Warehouse Stock: {purchasingItem.warehouse_stock || 0}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number" min="1" max={purchasingItem.warehouse_stock || 1} required autoFocus
                        className="h-12 text-lg font-bold pl-4"
                        value={purchaseQty}
                        onChange={e => setPurchaseQty(Number(e.target.value))}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {purchaseQty > 40 ? 
                          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
                            <Truck className="h-3 w-3" /> Wholesale
                          </Badge> : 
                          <Badge variant="outline" className="text-primary border-primary/20 flex items-center gap-1">
                            <Package className="h-3 w-3" /> Retail
                          </Badge>
                        }
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Wholesale rates apply to all procurement orders.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-medium">₹{purchasingItem.wholesale_price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Units</span>
                      <span className="font-medium">{purchaseQty}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="font-bold">Total Payable</span>
                      <span className="text-2xl font-black text-primary">₹{(purchasingItem.wholesale_price * purchaseQty).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setPurchasingItem(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 h-11 shadow-lg shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Order'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
