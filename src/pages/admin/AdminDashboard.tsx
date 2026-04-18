import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Package, ShoppingCart, TrendingUp, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [productCount, setProductCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [activeOrders, setActiveOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [shipmentCount, setShipmentCount] = useState<number>(0);

  const [productCatData, setProductCatData] = useState<{ name: string, value: number }[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      // Users by role
      const { data: users } = await (supabase.from('admin_user_view' as any) as any)
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false });
      if (users) {
        setUserCount(users.length);
        setUserList(users);
      }

      // Products by category
      const { data: products } = await (supabase.from('products' as any) as any).select('category');
      if (products) {
        setProductCount(products.length);
        const catCount = products.reduce((acc: any, p: any) => {
          const cat = p.category || 'Uncategorized';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});
        setProductCatData(Object.keys(catCount).map(k => ({ name: k, value: catCount[k] })));
      }

      // Orders logic
      const { data: orders } = await (supabase.from('orders' as any) as any).select('status, total_price, quantity');
      if (orders) {
        const active = orders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length;
        const wholesaleShipments = orders.filter((o: any) => o.status === 'shipped' && (o.quantity || 0) > 40).length;
        const retailShipments = orders.filter((o: any) => o.status === 'shipped' && (o.quantity || 0) <= 40).length;
        const shipments = wholesaleShipments + retailShipments;
        const delivered = orders.filter((o: any) => o.status === 'delivered').length;
        const cancelled = orders.filter((o: any) => o.status === 'cancelled').length;

        const rev = orders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);

        setActiveOrders(active + shipments);
        setTotalRevenue(rev);
        setShipmentCount(shipments);

        setOrderStatusData([
          { name: 'Active (Orders/Prep)', value: active, color: '#3b82f6' }, // Blue
          { name: 'Wholesale Transit', value: wholesaleShipments, color: '#f59e0b' }, // Amber
          { name: 'Retail Transit', value: retailShipments, color: '#fcd34d' }, // Yellow
          { name: 'Delivered', value: delivered, color: '#10b981' },       // Emerald
          { name: 'Cancelled', value: cancelled, color: '#ef4444' }        // Red
        ]);
      }
    }
    loadStats();
  }, []);

  const ongoingTotal = (orderStatusData.find(d => d.name === 'Active (Orders/Prep)')?.value || 0) + 
                       (orderStatusData.find(d => d.name === 'Wholesale Transit')?.value || 0) +
                       (orderStatusData.find(d => d.name === 'Retail Transit')?.value || 0);
  const completedTotal = (orderStatusData.find(d => d.name === 'Delivered')?.value || 0) + 
                         (orderStatusData.find(d => d.name === 'Cancelled')?.value || 0);
  
  const innerData = [
    { name: 'In Progress', value: ongoingTotal, color: '#94a3b8' }, // Slate
    { name: 'Finalized', value: completedTotal, color: '#475569' } // Darker Slate
  ];

  const formatCurrency = (val: number) => {
    if (val > 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val > 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };



  const stats = [
    {
      title: 'Logistics Shipments',
      value: shipmentCount.toString(),
      icon: Truck,
      trend: 'Live',
      trendLabel: 'currently in transit'
    },
    { title: 'Products Listed', value: productCount.toString(), icon: Package, trend: 'Live', trendLabel: 'global catalog' },
    { title: 'Active Orders', value: activeOrders.toString(), icon: ShoppingCart, trend: 'Live', trendLabel: 'pending & processing' },
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, trend: 'Live', trendLabel: 'all-time volume' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {profile?.full_name?.split(' ')[0] || 'Administrator'}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system health, manage users, and track platform growth
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 text-success">
                  {stat.trend} <span className="text-muted-foreground">{stat.trendLabel}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Material Fulfillment Lifecycle</CardTitle>
              <CardDescription>Multi-level progress of all system materials</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart pill-id="fulfillment-sunburst">
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}
                    />
                    {/* Inner Level - General Groups */}
                    <Pie
                      data={innerData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={55}
                      stroke="none"
                    >
                      {innerData.map((entry, index) => (
                        <Cell key={`inner-${index}`} fill={entry.color} opacity={0.6} />
                      ))}
                    </Pie>
                    {/* Outer Level - Specific Statuses */}
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      stroke="none"
                      label={({ name, value }) => value > 0 ? `${value}` : null}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`outer-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No activity data available</div>
              )}
            </CardContent>
          </Card>

          {/* Product Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Catalog Categories</CardTitle>
              <CardDescription>Volume of products per global category</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {productCatData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productCatData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      fontSize={13}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      fontSize={13}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}
                    />
                    <Bar name="Product Count" dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No product data available</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
