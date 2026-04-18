import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Package, AlertTriangle, Loader2, Tag, Trash2, Edit2, Plus, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorProducts() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New listing state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newStock, setNewStock] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchVendorInventory();
      fetchProductsCatalog();
    }
  }, [user]);

  const fetchProductsCatalog = async () => {
    const { data } = await (supabase.from('products' as any) as any)
      .select('*')
      .eq('status', 'active');
    if (data) setAllProducts(data);
  };

  const fetchVendorInventory = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('vendor_inventory' as any) as any)
      .select(`
        id,
        retail_price,
        stock,
        status,
        products (
          id,
          name,
          category,
          retail_mrp,
          retail_mop
        )
      `)
      .eq('vendor_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load products: ' + error.message);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStock = async (itemId: string, currentStock: number) => {
    const newStock = prompt('Enter new stock quantity:', currentStock.toString());
    if (newStock === null || isNaN(Number(newStock))) return;
    
    try {
      const { error } = await (supabase.from('vendor_inventory' as any) as any)
        .update({ stock: Number(newStock) })
        .eq('id', itemId);
        
      if (error) throw error;
      toast.success('Stock updated');
      fetchVendorInventory();
    } catch (e: any) {
      toast.error('Update failed: ' + e.message);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedProductId) return;

    const product = allProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    const price = Number(newPrice);
    const stock = Number(newStock);

    if (price < product.retail_mop) {
      toast.error(`Price is too low! Minimum is ₹${product.retail_mop}`);
      return;
    }
    if (price > product.retail_mrp) {
      toast.error(`Price exceeds MRP of ₹${product.retail_mrp}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('vendor_inventory' as any) as any)
        .insert({
          vendor_id: user.id,
          product_id: selectedProductId,
          stock: stock,
          retail_price: price,
          status: 'active'
        });

      if (error) throw error;
      
      toast.success('Material added to your inventory!');
      setIsAddModalOpen(false);
      resetForm();
      fetchVendorInventory();
    } catch (e: any) {
      toast.error('Failed to add material: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setNewPrice('');
    setNewStock('1');
  };

  const handleDeleteListing = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const { error } = await (supabase.from('vendor_inventory' as any) as any)
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      toast.success('Listing deleted');
      fetchVendorInventory();
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  const filtered = inventory.filter(item =>
    (item.products?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.products?.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Your Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage stock counts and listings for your products</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add to My Inventory</DialogTitle>
                <DialogDescription>List an existing material in your retail catalog.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMaterial} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Material</Label>
                  <Select onValueChange={(val) => {
                    setSelectedProductId(val);
                    const prod = allProducts.find(p => p.id === val);
                    if (prod) setNewPrice(prod.retail_mrp.toString());
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProductId && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg text-xs">
                        <p className="text-muted-foreground mb-1 uppercase font-semibold">Retail MRP</p>
                        <p className="text-lg font-bold">₹{allProducts.find(p => p.id === selectedProductId)?.retail_mrp}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-xs">
                        <p className="text-muted-foreground mb-1 uppercase font-semibold">Min (MOP)</p>
                        <p className="text-lg font-bold">₹{allProducts.find(p => p.id === selectedProductId)?.retail_mop}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Selling Price (₹)</Label>
                        <Input 
                          id="price" type="number" step="0.01" required
                          value={newPrice} 
                          onChange={e => setNewPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Initial Stock</Label>
                        <Input 
                          id="stock" type="number" required
                          value={newStock}
                          onChange={e => setNewStock(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !selectedProductId}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Listing'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>


        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium">Your inventory is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              Source materials from the warehouse in the "Material Shop" section to build your retail catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const mrp = Number(item.products?.retail_mrp || 0);
              const price = Number(item.retail_price || 0);
              const discPct = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
              const isLowStock = Number(item.stock) > 0 && Number(item.stock) < 5;
              const isOutOfStock = Number(item.stock) === 0;

              return (
                <Card key={item.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  {/* Low stock / out of stock badge */}
                  {isOutOfStock && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">Out of Stock</Badge>
                    </div>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                      </Badge>
                    </div>
                  )}

                  {/* Discount badge */}
                  {discPct > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" /> {discPct}% OFF
                      </Badge>
                    </div>
                  )}

                  {/* Product image placeholder */}
                  <div className="h-28 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <Package className="h-12 w-12 text-primary/40" />
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div>
                      <p className="font-semibold text-sm leading-tight">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.products?.category}</p>
                    </div>

                    <div className="flex items-baseline justify-center gap-2 text-center">
                      <span className="text-lg font-bold text-primary">₹{price}</span>
                      {discPct > 0 && (
                        <span className="text-xs text-muted-foreground line-through">₹{mrp}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className={`text-xs font-medium ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-muted-foreground'}`}>
                        {isOutOfStock ? 'Out of stock' : `${item.stock} units`}
                      </span>
                      <div className="flex bg-muted/30 rounded-lg p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleUpdateStock(item.id, item.stock)}
                          title="Update Stock"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDeleteListing(item.id)}
                          title="Delete Listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
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
