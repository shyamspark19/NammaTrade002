import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Truck,
  Store,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Warehouse,
  ShoppingCart,
  AlertTriangle,
  Users,
  BoxSelect,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const statusColors: Record<string, string> = {
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  packed: 'bg-accent/10 text-accent-foreground border-accent/20',
  delivered: 'bg-success/10 text-success border-success/20',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary-foreground',
  success: 'bg-success/10 text-success',
  accent: 'bg-accent/10 text-accent-foreground'
};

export default function WarehouseDashboard() {
  const { user, profile } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([
    { title: 'Total Orders', value: '0', change: '0%', trend: 'up', icon: Package, color: 'primary' },
    { title: 'In Transit', value: '0', change: '0%', trend: 'up', icon: Truck, color: 'secondary' },
    { title: 'Active Buyers', value: '0', change: '0%', trend: 'up', icon: Store, color: 'success' },
    { title: 'Revenue', value: '₹0', change: '0%', trend: 'up', icon: TrendingUp, color: 'accent' }
  ]);
  const [overviewStats, setOverviewStats] = useState({
    totalSkus: 0,
    totalMaterials: 0,
    activeUsers: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingShipments: 0,
    totalProfit: 0,
    totalLoss: 0,
  });
  const [categoryData, setCategoryData] = useState<{ category: string; count: number; pct: number }[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: orders, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, order_type, quantity, total_price,
          buyer_id, product_id,
          profiles!orders_buyer_id_fkey(full_name)
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const latestOrders = (orders || []).slice(0, 5);
      setRecentOrders(latestOrders);

      const totalOrders = orders?.length || 0;
      const shippedOrProcessing = orders?.filter(o => o.status === 'shipped' || o.status === 'processing').length || 0;
      const uniqueBuyers = new Set(orders?.map(o => o.buyer_id)).size;
      
      const revenue = orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      const formattedRevenue = revenue > 100000 ? `₹${(revenue/100000).toFixed(1)}L` : `₹${revenue}`;

      setStats([
        { title: 'Total Orders', value: totalOrders.toString(), change: '+12%', trend: 'up', icon: Package, color: 'primary' },
        { title: 'In Transit', value: shippedOrProcessing.toString(), change: '+5%', trend: 'up', icon: Truck, color: 'secondary' },
        { title: 'Active Buyers', value: uniqueBuyers.toString(), change: '+2%', trend: 'up', icon: Store, color: 'success' },
        { title: 'Revenue', value: formattedRevenue, change: '+8%', trend: 'up', icon: TrendingUp, color: 'accent' }
      ]);

      const pendingOrdersCount = orders?.filter((o: any) => o.status === 'processing' || o.status === 'packed').length || 0;

      // Fetch inventory with product category info
      const { data: inventoryData } = await (supabase.from('inventory' as any) as any)
        .select('id, quantity, product_id, products(name, category, base_price, wholesale_price)')
        .eq('warehouse_id', user?.id);

      const totalSkus = inventoryData?.length || 0;
      const lowStock = inventoryData?.filter((i: any) => Number(i.quantity) > 0 && Number(i.quantity) < 50).length || 0;
      const outOfStock = inventoryData?.filter((i: any) => Number(i.quantity) === 0).length || 0;

      // Live profit / loss calculation based on base_price vs sale price
      let totalProfit = 0;
      let totalLoss = 0;
      (orders || []).forEach((o: any) => {
        const invItem = inventoryData?.find((i: any) => i.product_id === o.product_id);
        const basePrice = invItem?.products?.base_price || 0;
        const cost = basePrice * o.quantity;
        const revenue = Number(o.total_price);
        const margin = revenue - cost;
        if (margin >= 0) totalProfit += margin;
        else totalLoss += Math.abs(margin);
      });

      // Count unique active users (buyers)
      const uniqueUserCount = new Set((orders || []).map((o: any) => o.buyer_id)).size;

      // Group inventory by category for chart bars
      const catMap: Record<string, number> = {};
      (inventoryData || []).forEach((i: any) => {
        const cat = i.products?.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const totalItems = totalSkus || 1;
      const catArr = Object.entries(catMap).map(([category, count]) => ({
        category,
        count,
        pct: Math.round((count / totalItems) * 100)
      }));
      setCategoryData(catArr);

      setOverviewStats({
        totalSkus,
        totalMaterials: totalSkus,
        activeUsers: uniqueUserCount,
        lowStock,
        outOfStock,
        pendingShipments: pendingOrdersCount,
        totalProfit,
        totalLoss,
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const formatDistanceToNow = (dateStr: string) => {
    const min = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (min < 60) return `${min} min ago`;
    const hours = Math.round(min / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.round(hours / 24)} days ago`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Logistics Lead'}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Track inventory, fulfill procurement requests, and manage logistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-display font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-success text-sm' : 'text-destructive text-sm'}>
                        {stat.change}
                      </span>
                      <span className="text-muted-foreground text-sm">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Latest warehouse orders</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No orders placed yet
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {order.order_type === 'wholesale' ? (
                          <Warehouse className="h-5 w-5 text-primary" />
                        ) : (
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">WH-{order.id.substring(0, 4)}</p>
                          <Badge variant="outline" className={statusColors[order.status] || statusColors.pending}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.full_name || 'Unknown User'} · {order.quantity} units
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(order.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Overview</CardTitle>
              <CardDescription>Live inventory & financial stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><BoxSelect className="h-4 w-4" /> Total Materials</span>
                  <span className="font-semibold">{overviewStats.totalMaterials.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Active Users</span>
                  <span className="font-semibold">{overviewStats.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4 text-warning" /> Low Stock</span>
                  <span className={`font-semibold ${overviewStats.lowStock > 0 ? 'text-warning' : 'text-foreground'}`}>
                    {overviewStats.lowStock} items
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4 text-destructive" /> Out of Stock</span>
                  <span className={`font-semibold ${overviewStats.outOfStock > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {overviewStats.outOfStock} items
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4" /> Pending Shipments</span>
                  <span className="font-semibold">{overviewStats.pendingShipments}</span>
                </div>
              </div>

              {/* Profit / Loss */}
              <div className="pt-3 border-t grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-success/10 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-xs text-success font-medium">Total Profit</span>
                  </div>
                  <p className="text-lg font-bold text-success">
                    ₹{overviewStats.totalProfit > 100000 ? `${(overviewStats.totalProfit/100000).toFixed(1)}L` : overviewStats.totalProfit.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-xs text-destructive font-medium">Total Loss</span>
                  </div>
                  <p className="text-lg font-bold text-destructive">
                    ₹{overviewStats.totalLoss > 100000 ? `${(overviewStats.totalLoss/100000).toFixed(1)}L` : overviewStats.totalLoss.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Live Category Breakdown */}
              <div className="pt-3 border-t">
                <h4 className="font-medium mb-3">Stock by Category</h4>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No inventory data yet</p>
                ) : (
                  <div className="space-y-3">
                    {categoryData.map((cat, idx) => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{cat.category}</span>
                          <span className="font-medium">{cat.count} SKUs ({cat.pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx % 3 === 0 ? 'gradient-primary' : idx % 3 === 1 ? 'bg-success' : 'bg-secondary'}`}
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
