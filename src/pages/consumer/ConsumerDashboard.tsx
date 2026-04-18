import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, ArrowUpRight, Clock, Truck, Loader2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  in_transit: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  shipped: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function ConsumerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    inTransit: 0,
    totalSpent: 0,
    wishlistCount: 0,
  });

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Orders
      const { data: userOrders, error: ordersError } = await (supabase.from('orders' as any) as any)
        .select(`
          id, total_price, status, created_at, product_id,
          profiles!orders_seller_id_fkey ( full_name, email ),
          products ( name, category )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;

      const ordersList = userOrders || [];
      const activeOrders = ordersList.filter((o: any) => o.status !== 'cancelled');
      const transitCount = activeOrders.filter((o: any) => ['pending', 'processing', 'shipped', 'in_transit'].includes(o.status)).length;
      const spent = activeOrders.reduce((s: number, o: any) => s + Number(o.total_price), 0);

      // Wishlist count
      const { count: wishCount } = await (supabase.from('wishlist' as any) as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setStats({ totalOrders: ordersList.length, inTransit: transitCount, totalSpent: spent, wishlistCount: wishCount || 0 });
      setRecentOrders(ordersList.slice(0, 5));

      // Recommended with MRP
      const { data: recs } = await (supabase.from('vendor_inventory' as any) as any)
        .select(`
          id, retail_price,
          profiles!vendor_inventory_vendor_id_fkey ( full_name ),
          products ( name, retail_mrp, category )
        `)
        .eq('status', 'active')
        .gt('stock', 0)
        .limit(4);
      setRecommended(recs || []);
    } catch (e: any) {
      toast.error('Failed to load dashboard: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'My Orders', value: stats.totalOrders.toString(), sub: 'Lifetime', icon: Package, color: 'bg-primary/10 text-primary' },
    { title: 'In Transit', value: stats.inTransit.toString(), sub: 'Active shipments', icon: Truck, color: 'bg-secondary/10 text-secondary-foreground' },
    { title: 'Total Spent', value: `₹${stats.totalSpent > 100000 ? `${(stats.totalSpent / 100000).toFixed(1)}L` : stats.totalSpent.toLocaleString()}`, sub: 'Platform total', icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { title: 'Wishlist', value: stats.wishlistCount.toString(), sub: 'Saved items', icon: Heart, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Guest'}! 👋</h1>
          <p className="text-muted-foreground mt-1">Browse products, track orders, and discover live deals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="group hover:shadow-lg transition-shadow relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-display font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" /> : stat.value}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ArrowUpRight className="h-4 w-4 text-primary" /> {stat.sub}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Recent Orders
              </CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : recentOrders.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">You haven't ordered anything yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-medium truncate">{order.products?.name}</p>
                          <Badge variant="outline" className={`${statusColors[order.status] || ''} text-[10px] uppercase font-bold py-0 h-4`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.products?.category} · {order.profiles?.full_name || order.profiles?.email}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-primary">₹{order.total_price}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended</CardTitle>
              <CardDescription>Live deals from vendors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : recommended.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No recommendations available</p>
              ) : (
                recommended.map((product, idx) => {
                  const mrp = Number(product.products?.retail_mrp || 0);
                  const price = Number(product.retail_price || 0);
                  const discPct = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
                  return (
                    <div
                    key={idx}
                    onClick={() => navigate(`/consumer/shop?item=${product.id}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/30 cursor-pointer group"
                  >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary uppercase">
                        {product.products?.name?.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.products?.name}</p>
                        <p className="text-xs text-muted-foreground">{product.products?.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">₹{price}</p>
                        {discPct > 0 && <p className="text-[10px] text-muted-foreground line-through">₹{mrp}</p>}
                      </div>
                      {discPct > 0 && (
                        <Badge className="bg-success text-success-foreground text-[9px] px-1 py-0 flex-shrink-0">{discPct}%</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
