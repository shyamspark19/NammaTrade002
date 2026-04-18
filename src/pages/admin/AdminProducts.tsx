import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Package, Edit, Trash2, Loader2, IndianRupee } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  wholesale_price: number;
  retail_mrp: number;
  retail_mop: number;
  status: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    wholesale_price: '',
    retail_mrp: '',
    retail_mop: '',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('products' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load products');
      console.error(error);
    } else {
      setProducts((data as any) || []);
    }
    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await (supabase.from('products' as any) as any).insert([
      {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        base_price: Number(formData.base_price),
        wholesale_price: Number(formData.wholesale_price),
        retail_mrp: Number(formData.retail_mrp),
        retail_mop: Number(formData.retail_mop),
        status: 'pending_warehouse' // Admin materials explicitly require warehouse to post/activate
      }
    ]);

    if (error) {
      console.error(error);
      toast.error(`ERROR: ${error.message} | Details: ${error.details || 'None'} | Hint: ${error.hint || 'None'}`);
    } else {
      toast.success('Product pushed to Warehouse queue successfully!');
      setShowAddForm(false);
      setFormData({ name: '', description: '', category: '', base_price: '', wholesale_price: '', retail_mrp: '', retail_mop: '' });
      fetchProducts();
    }
    setIsSubmitting(false);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setIsSubmitting(true);

    const { error } = await (supabase.from('products' as any) as any)
      .update({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        base_price: Number(formData.base_price),
        wholesale_price: Number(formData.wholesale_price),
        retail_mrp: Number(formData.retail_mrp),
        retail_mop: Number(formData.retail_mop),
        status: 'pending_warehouse' // Force re-verification on edit
      })
      .eq('id', editingProductId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Global product updated and sent for warehouse verification!');
      setEditingProductId(null);
      setShowAddForm(false);
      setFormData({ name: '', description: '', category: '', base_price: '', wholesale_price: '', retail_mrp: '', retail_mop: '' });
      fetchProducts();
    }
    setIsSubmitting(false);
  };

  const startEdit = (p: Product) => {
    setEditingProductId(p.id);
    setFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      base_price: p.base_price.toString(),
      wholesale_price: p.wholesale_price.toString(),
      retail_mrp: p.retail_mrp.toString(),
      retail_mop: p.retail_mop.toString(),
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global product?')) return;
    
    const { error } = await (supabase.from('products' as any) as any).delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Global Products Catalog</h1>
            <p className="text-muted-foreground mt-1">
              Manage base products, wholesale prices, and enforce retail MRP/MOP limits
            </p>
          </div>
          <Button onClick={() => {
            if (showAddForm) {
              setEditingProductId(null);
              setFormData({ name: '', description: '', category: '', base_price: '', wholesale_price: '', retail_mrp: '', retail_mop: '' });
            }
            setShowAddForm(!showAddForm);
          }} className="gap-2">
            {showAddForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Product</>}
          </Button>
        </div>

        {showAddForm && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle>{editingProductId ? 'Edit Global Product' : 'Add New Global Product'}</CardTitle>
              <CardDescription>
                {editingProductId 
                  ? 'Update pricing and boundaries. Changes will require warehouse re-approval.' 
                  : 'Define base pricing and the strict MRP (Max Price) and MOP (Min Price) retail boundaries.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingProductId ? handleUpdateProduct : handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input required placeholder="E.g. Premium Rice 5kg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input required placeholder="E.g. Food & Grains" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input placeholder="Detailed description of the base material..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Base Manufacturing Cost (₹)</Label>
                  <Input type="number" required min="0" step="0.01" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary font-semibold">Wholesale Selling Price (₹)</Label>
                  <Input type="number" required min="0" step="0.01" value={formData.wholesale_price} onChange={e => setFormData({...formData, wholesale_price: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <Label className="text-destructive font-semibold">Retail MOP (Minimum allowed ₹)</Label>
                  <Input type="number" required min="0" step="0.01" value={formData.retail_mop} onChange={e => setFormData({...formData, retail_mop: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-success font-semibold">Retail MRP (Maximum allowed ₹)</Label>
                  <Input type="number" required min="0" step="0.01" value={formData.retail_mrp} onChange={e => setFormData({...formData, retail_mrp: e.target.value})} />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingProductId ? 'Update Product' : 'Save Global Product')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Product Directory
                </CardTitle>
              </div>
              <Badge variant="outline">{products.length} total items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground">Add your first global product to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">MOP / Wholesale</th>
                      <th className="px-4 py-3">Retail Bounds (MOP - MRP)</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4 font-medium text-foreground">
                          {p.name}
                          {p.status === 'active' && <Badge variant="secondary" className="ml-2 text-[10px]">Active</Badge>}
                        </td>
                        <td className="px-4 py-4">{p.category}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground line-through text-xs">₹{p.retail_mop}</span>
                            <span className="font-semibold text-primary">₹{p.wholesale_price}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="text-destructive font-medium">₹{p.retail_mop}</span>
                            <span>-</span>
                            <span className="text-success font-medium">₹{p.retail_mrp}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => startEdit(p)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
