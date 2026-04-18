import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Tags, Percent, Truck, Receipt, Loader2, Package, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function VendorPricing() {
  const { user } = useAuth();
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgDiscount: 0, activeOffers: 0 });

  // Edit modal state
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) fetchPricingData();
  }, [user]);

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('vendor_inventory' as any) as any)
        .select(`
          id,
          retail_price,
          stock,
          status,
          products (
            id,
            name,
            retail_mrp,
            retail_mop
          )
        `)
        .eq('vendor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = data || [];
      let totalDiscountPercent = 0;
      let offers = 0;

      const formatted = items.map((item: any) => {
        const mrp = Number(item.products?.retail_mrp || 0);
        const mop = Number(item.products?.retail_mop || 0);
        const price = Number(item.retail_price || 0);

        let discountPercent = 0;
        let discountStr = '0%';
        if (mrp > 0 && price < mrp) {
          discountPercent = ((mrp - price) / mrp) * 100;
          discountStr = discountPercent.toFixed(1) + '%';
          offers++;
        }
        totalDiscountPercent += discountPercent;

        return {
          id: item.id,
          product_id: item.products?.id,
          name: item.products?.name,
          mrp,
          mop,
          discount: discountStr,
          discountPercent,
          finalPrice: price,
          stock: item.stock,
          isDiscounted: discountPercent > 0
        };
      });

      setPricingData(formatted);
      setStats({
        avgDiscount: items.length > 0 ? (totalDiscountPercent / items.length) : 0,
        activeOffers: offers
      });
    } catch (e: any) {
      toast.error('Failed to load pricing data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditPrice(item.finalPrice.toString());
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const newPrice = Number(editPrice);

    if (newPrice > editItem.mrp) {
      toast.error(`Price cannot exceed MRP (₹${editItem.mrp})`);
      return;
    }
    if (newPrice < editItem.mop) {
      toast.error(`Price cannot be lower than MOP (₹${editItem.mop})`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase.from('vendor_inventory' as any) as any)
        .update({ retail_price: newPrice })
        .eq('id', editItem.id);

      if (error) throw error;
      toast.success('Pricing updated!');
      setEditItem(null);
      fetchPricingData();
    } catch (e: any) {
      toast.error('Failed to update: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const summaryCards = [
    { title: 'Avg. Discount', value: `${stats.avgDiscount.toFixed(1)}%`, icon: Percent, color: 'bg-primary/10 text-primary' },
    { title: 'Avg. Shipping', value: '₹0.0', icon: Truck, color: 'bg-secondary/10 text-secondary-foreground' },
    { title: 'Avg. Tax Rate', value: '18.0%', icon: Receipt, color: 'bg-primary/10 text-primary' },
    { title: 'Active Offers', value: stats.activeOffers.toString(), icon: Tags, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Pricing & Offers</h1>
          <p className="text-muted-foreground mt-1">Manage discounts, MOP bounds, and your final selling prices</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Pricing</CardTitle>
            <CardDescription>Each row is a unique discount tier — click Edit to change the selling price within MOP–MRP bounds</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : pricingData.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 rounded-lg m-4">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium">No catalog found</h3>
                <p className="text-muted-foreground mt-2">Add products in "Products" section first.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>MOP</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-[80px]">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product_id?.split('-')[0]}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground line-through decoration-destructive/50">₹{item.mrp}</TableCell>
                      <TableCell className="text-muted-foreground">₹{item.mop}</TableCell>
                      <TableCell>
                        {(() => {
                          const pct = item.discountPercent;
                          const color = pct > 10 ? '#22c55e' : pct > 0 ? '#f97316' : '#9ca3af';
                          return (
                            <span style={{ color, fontWeight: 'bold', fontSize: '0.875rem' }}>
                              {item.discount}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">18% GST</TableCell>
                      <TableCell className="font-bold text-primary">₹{item.finalPrice}</TableCell>
                      <TableCell className={Number(item.stock) < 5 ? 'text-warning font-medium' : 'text-muted-foreground'}>
                        {item.stock} units
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pricing — {editItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">MRP (Ceiling)</p>
                <p className="font-bold text-lg">₹{editItem?.mrp}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">MOP (Floor)</p>
                <p className="font-bold text-lg">₹{editItem?.mop}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Selling Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                placeholder={`Between ₹${editItem?.mop} and ₹${editItem?.mrp}`}
              />
              {editPrice && editItem && (
                <p className="text-xs text-muted-foreground">
                  Discount: {Math.max(0, Math.round(((editItem.mrp - Number(editPrice)) / editItem.mrp) * 100))}% off MRP
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditItem(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
