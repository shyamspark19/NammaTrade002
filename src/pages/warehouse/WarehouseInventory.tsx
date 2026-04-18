import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, Import, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function WarehouseInventory() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const newProductParam = searchParams.get('newProduct');

  const [inventory, setInventory] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(!!newProductParam);

  const [formData, setFormData] = useState({
    product_id: newProductParam || '',
    quantity_to_add: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchGlobalProducts();
      fetchInventory();
    }
  }, [user]);

  const fetchGlobalProducts = async () => {
    // 1. Fetch active products for the dropdown menu
    const { data: activeData, error: activeErr } = await (supabase.from('products' as any) as any)
      .select('id, name, category, wholesale_price')
      .eq('status', 'active');
    
    if (activeData) setGlobalProducts(activeData);

    // 2. Fetch pending products awaiting warehouse verification
    const { data: pendingData, error: pendingErr } = await (supabase.from('products' as any) as any)
      .select('*')
      .eq('status', 'pending_warehouse')
      .order('created_at', { ascending: false });

    if (pendingData) setPendingProducts(pendingData);
  };

  const handleApproveProduct = async (productId: string) => {
    const toastId = toast.loading('Approving product into global catalog...');
    try {
      // Execute the RLS Bypass Function securely
      const { error } = await supabase.rpc('approve_pending_product' as any, { p_product_id: productId });
        
      if (error) throw error;
      
      toast.success('Product Approved & Posted Live!', { id: toastId });
      
      // Snag the product from pending arrays mathematically
      const freshlyApprovedProduct = pendingProducts.find(p => p.id === productId);

      // Instantly wipe from pending and inject directly to dropdown list
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      if (freshlyApprovedProduct) {
        setGlobalProducts(prev => [freshlyApprovedProduct, ...prev]);
      }
      
      // Auto-open logistic stock form and firmly map the newly approved product ID
      setShowAddForm(true);
      setFormData({ product_id: productId, quantity_to_add: '' });
      
      // Refresh background quietly as redundancy check
      fetchGlobalProducts(); 
    } catch (e: any) {
      toast.error('Failed to approve product: ' + e.message, { id: toastId });
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    // Fetch inventory for this specific warehouse along with product details via foreign key
    const { data, error } = await (supabase.from('inventory' as any) as any)
      .select(`
        id,
        quantity,
        updated_at,
        products (
          id,
          name,
          category,
          wholesale_price
        )
      `)
      .eq('warehouse_id', user?.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load inventory: ' + error.message);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);

    try {
      // Find if this product is already in inventory
      const existingItem = inventory.find(i => i.products?.id === formData.product_id);
      const quantityToAddNum = Number(formData.quantity_to_add);

      if (existingItem) {
        // Update existing stock
        const newQuantity = Number(existingItem.quantity) + quantityToAddNum;
        const { error } = await (supabase.from('inventory' as any) as any)
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        // Insert new stock
        const { error } = await (supabase.from('inventory' as any) as any).insert({
          warehouse_id: user.id,
          product_id: formData.product_id,
          quantity: quantityToAddNum
        });
        if (error) throw error;
      }

      toast.success(`Successfully added ${quantityToAddNum} units to inventory!`);
      setFormData({ product_id: '', quantity_to_add: '' });
      setShowAddForm(false);
      if (newProductParam) {
        searchParams.delete('newProduct');
        setSearchParams(searchParams);
      }
      fetchInventory();

    } catch (e: any) {
      console.error(e);
      toast.error(`Error adding stock: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Local Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage physical stock loaded into this warehouse location
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            {showAddForm ? 'Cancel' : <><Import className="h-4 w-4" /> Receive Logistics Stock</>}
          </Button>
        </div>

        {showAddForm && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle>Receive New Logistic Stock</CardTitle>
              <CardDescription>
                Map incoming physical goods to the Admin's Global Product Catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStock} className="flex flex-col md:flex-row items-end gap-4">
                <div className="space-y-2 w-full md:flex-1">
                  <Label>Global Product</Label>
                  <Select required value={formData.product_id} onValueChange={(val) => setFormData({...formData, product_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {globalProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full md:w-48">
                  <Label>Quantity Received (Units/Kg)</Label>
                  <Input 
                    type="number" 
                    required 
                    min="1" 
                    step="1" 
                    placeholder="e.g. 500"
                    value={formData.quantity_to_add}
                    onChange={e => setFormData({...formData, quantity_to_add: e.target.value})}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to Inventory'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pending Products Approvals */}
        {pendingProducts.length > 0 && (
          <Card className="border-warning/50 shadow-md">
            <CardHeader className="bg-warning/10 pb-4 border-b border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-warning flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Admin Approvals ({pendingProducts.length})
                  </CardTitle>
                  <CardDescription className="text-warning/80 mt-1">
                    Review incoming catalog materials uploaded by Admin. They are hidden from stores until you officially post them.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {pendingProducts.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-all gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-warning/20 border-warning text-warning-foreground">Pending Review</Badge>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">{p.category}</span>
                      </div>
                      <h4 className="text-lg font-bold mt-1">{p.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-xl pr-4">{p.description || "No description provided."}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground">MOP / MRP bounds</p>
                        <p className="font-mono text-sm mt-1">₹{p.retail_mop} <span className="text-muted-foreground mx-1">-</span> ₹{p.retail_mrp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Wholesale Value</p>
                        <p className="font-semibold text-success mt-1">₹{p.wholesale_price}</p>
                      </div>
                      <Button onClick={() => handleApproveProduct(p.id)} className="gap-2 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve & Post
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Stock Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Current In-Stock Items
              </CardTitle>
              <Badge variant="outline">{inventory.length} items logged</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 rounded-lg">
                <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-foreground">Your warehouse is empty!</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  You haven't logged any physical stock yet. Click "Receive Logistics Stock" to add products from the global catalog into your local storage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {inventory.map((item) => (
                  <Card key={item.id} className="overflow-hidden bg-card hover:shadow-md transition-all border-muted/60">
                    <div className="h-2 w-full bg-gradient-to-r from-primary/80 to-secondary/80"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">{item.products?.category}</p>
                          <CardTitle className="text-lg mt-1">{item.products?.name}</CardTitle>
                        </div>
                        <Badge variant={item.quantity > 50 ? 'default' : 'destructive'}>
                          {item.quantity > 50 ? 'In Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Available Quantity</p>
                          <p className="text-3xl font-bold font-mono tracking-tight mt-1">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wholesale Value</p>
                          <p className="text-lg font-semibold text-success mt-1">
                            ₹{item.products?.wholesale_price} / unit
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
