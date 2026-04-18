import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Store, Package, TrendingUp, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function WarehouseVendors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorTotals, setVendorTotals] = useState({ products: 0, revenue: 0 });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      // 1. Fetch vendor profiles via RPC (bypasses RLS for Warehouse role)
      const { data: profileData, error: rpcErr } = await supabase.rpc('get_warehouse_vendors' as any);
      if (rpcErr) throw rpcErr;

      if (profileData && profileData.length > 0) {
        const vendorIds = profileData.map((v: any) => v.id);

        // 2. Fetch aggregate stats for these vendors
        // Total Spend & Order Count per vendor
        const { data: orderStats } = await (supabase.from('orders' as any) as any)
          .select('id, total_price, buyer_id')
          .in('buyer_id', vendorIds);

        // SKU Count per vendor
        const { data: skuStats } = await (supabase.from('vendor_inventory' as any) as any)
          .select('id, vendor_id')
          .in('vendor_id', vendorIds);

        // 3. Map everything together
        const mappedVendors = profileData.map((vendor: any) => {
          const vOrders = (orderStats || []).filter((o: any) => o.buyer_id === vendor.id);
          const vSkus = (skuStats || []).filter((s: any) => s.vendor_id === vendor.id);
          
          return {
            ...vendor,
            total_orders: vOrders.length,
            total_spend: vOrders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0),
            sku_count: vSkus.length,
            status: 'active'
          };
        });

        mappedVendors.sort((a: any, b: any) => b.total_spend - a.total_spend);
        setVendors(mappedVendors);

        // 4. Update overall aggregate totals
        const totalRevenue = (orderStats || []).reduce((sum: number, o: any) => sum + Number(o.total_price), 0);
        const totalStocked = (orderStats || []).reduce((sum: number, o: any) => sum + (o.quantity || 0), 0);
        setVendorTotals({ revenue: totalRevenue, products: totalStocked });
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const filtered = vendors.filter(v =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.phone || '').includes(searchQuery)
  );

  const formattedRevenue = vendorTotals.revenue > 100000 
    ? `₹${(vendorTotals.revenue/100000).toFixed(2)}L` 
    : `₹${vendorTotals.revenue.toLocaleString()}`;

  const vendorStats = {
    total: vendors.length,
    active: vendors.length,
    totalProducts: vendorTotals.products.toLocaleString(),
    totalRevenue: formattedRevenue,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Vendors</h1>
            <p className="text-muted-foreground mt-1">View vendor partnerships and performance</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{vendorStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{vendorStats.active}</div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Package className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{vendorStats.totalProducts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{vendorStats.totalRevenue}</div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Vendors</CardTitle>
                <CardDescription>Vendor directory</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vendor) => (
                  <TableRow key={vendor.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {(vendor.name || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">SKUs: {vendor.sku_count || 0}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{vendor.email}</span>
                        <span className="text-xs text-muted-foreground">{vendor.phone || 'No Phone'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{vendor.total_orders || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ₹{(vendor.total_spend || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(vendor.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Package className="h-4 w-4 mr-2" /> View Products
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No vendors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
