import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  Users,
  Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const stats = [
  { title: 'Total Products', value: '148', change: '+12 this month', trend: 'up', icon: Package, color: 'bg-primary/10 text-primary' },
  { title: 'Revenue', value: '₹8.4L', change: '+15.3%', trend: 'up', icon: DollarSign, color: 'bg-primary/10 text-primary' },
  { title: 'Active Orders', value: '67', change: '+8.1%', trend: 'up', icon: ShoppingCart, color: 'bg-secondary/10 text-secondary-foreground' },
  { title: 'Customer Base', value: '1,284', change: '+4.2%', trend: 'up', icon: Users, color: 'bg-primary/10 text-primary' },
];

// Static arrays removed in favor of live data fetching

const statusColors: Record<string, string> = {
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
};

export default function VendorDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [recentOrdersList, setRecentOrdersList] = useState<any[]>([]);
  const [topProductsList, setTopProductsList] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch total products
    const { count: productCount } = await (supabase
      .from('vendor_inventory' as any) as any)
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', user?.id)
      .eq('status', 'active');
      
    // Fetch active orders
    const { count: orderCount } = await (supabase
      .from('orders' as any) as any)
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user?.id)
      .eq('status', 'pending');

    // Fetch recent orders
    const { data: recent } = await (supabase
      .from('orders' as any) as any)
      .select('id, status, total_price, quantity, created_at, profiles!orders_buyer_id_fkey(full_name), products(name)')
      .eq('seller_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch top products (recently updated inventory for now)
    const { data: top } = await (supabase
      .from('vendor_inventory' as any) as any)
      .select('retail_price, stock, products(name, retail_mrp, retail_mop)')
      .eq('vendor_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(4);

    // Fetch ALL orders to calc revenue + customers
    const { data: allOrders } = await (supabase.from('orders' as any) as any)
      .select('total_price, buyer_id, status')
      .eq('seller_id', user?.id);

    const rev = (allOrders || []).reduce((s: number, o: any) => s + Number(o.total_price), 0);
    const uniqueCustomers = new Set((allOrders || []).map((o: any) => o.buyer_id)).size;
    setTotalRevenue(rev);
    setTotalCustomers(uniqueCustomers);
    setTotalProducts(productCount || 0);
    setActiveOrders(orderCount || 0);
    if (recent) setRecentOrdersList(recent);
    if (top) setTopProductsList(top);
    setLoading(false);
  };
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Business Owner'}! 👋</h1>
          <p className="text-muted-foreground mt-1">Manage your products, track orders, and grow your business</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="group hover:shadow-lg transition-shadow relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-display font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" /> : totalProducts}
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Live Catalog</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Package className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-3xl font-display font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" /> : activeOrders}
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Pending fulfillment</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary-foreground">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-shadow relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-display font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" /> :
                      totalRevenue > 100000 ? `₹${(totalRevenue/100000).toFixed(1)}L` : `₹${totalRevenue.toLocaleString()}`
                    }
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">All Time</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
                  <p className="text-3xl font-display font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" /> : totalCustomers}
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">Buyers</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrdersList.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent orders found.</p>
                ) : (
                  recentOrdersList.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium" title={order.id}>{order.id.split('-')[0]}</p>
                          <Badge variant="outline" className={statusColors[order.status] || ''}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{order.profiles?.full_name || 'Customer'} · {order.products?.name} × {order.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">₹{order.total_price}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recently Restocked Catalog */}
          <Card>
            <CardHeader>
              <CardTitle>Catalog Activity</CardTitle>
              <CardDescription>Recently updated inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProductsList.length === 0 && !loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Your catalog is empty.</p>
              ) : (
                topProductsList.map((product, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.products?.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{product.stock} in stock</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through">₹{product.products?.retail_mrp}</p>
                      <p className="text-sm font-bold text-success">₹{product.retail_price}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
