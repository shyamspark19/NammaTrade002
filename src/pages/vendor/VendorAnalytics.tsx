import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ── SVG Pie Chart Helper ─────────────────────────────────────────────────────
function PieChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data yet</div>
  );

  let cumAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 70;

  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const startAngle = cumAngle;
    const sweep = pct * 2 * Math.PI;
    cumAngle += sweep;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = sweep > Math.PI ? 1 : 0;

    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: seg.color,
      label: seg.label,
      pct: Math.round(pct * 100),
      value: seg.value
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 160 160" className="w-40 h-40 flex-shrink-0">
        {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} stroke="var(--background)" strokeWidth="2" />)}
      </svg>
      <div className="space-y-2 flex-1">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: arc.color }} />
            <span className="text-muted-foreground flex-1">{arc.label}</span>
            <span className="font-semibold">{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dual Bar Chart Helper ────────────────────────────────────────────────────
function DualBarChart({ data }: { data: { month: string; profit: number; loss: number }[] }) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No monthly data yet</div>
  );
  const maxVal = Math.max(...data.flatMap(d => [d.profit, d.loss]), 1);

  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.month}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium w-12 text-muted-foreground">{d.month}</span>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${(d.profit / maxVal) * 100}%` }}
                />
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-destructive transition-all"
                  style={{ width: `${(d.loss / maxVal) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right w-24 text-xs">
              <p className="text-success font-medium">+₹{d.profit > 1000 ? `${(d.profit/1000).toFixed(1)}k` : d.profit}</p>
              <p className="text-destructive">-₹{d.loss > 1000 ? `${(d.loss/1000).toFixed(1)}k` : d.loss}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-success" /> Profit</div>
        <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-destructive" /> Loss</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VendorAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, orderCount: 0, avgOrderValue: 0, customers: 0, totalProfit: 0, totalLoss: 0 });
  const [pieData, setPieData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [monthlyPnL, setMonthlyPnL] = useState<{ month: string; profit: number; loss: number }[]>([]);

  useEffect(() => {
    if (user?.id) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error } = await (supabase.from('orders' as any) as any)
        .select('total_price, buyer_id, quantity, product_id, created_at, products(name, category, base_price)')
        .eq('seller_id', user?.id);

      if (error) throw error;
      const orders = ordersData || [];

      const revenue = orders.reduce((s: number, o: any) => s + Number(o.total_price), 0);
      const uniqueCustomers = new Set(orders.map((o: any) => o.buyer_id)).size;

      // Profit / Loss per order
      let totalProfit = 0, totalLoss = 0;
      const monthMap: Record<string, { profit: number; loss: number }> = {};

      orders.forEach((o: any) => {
        const baseCost = Number(o.products?.base_price || 0) * Number(o.quantity);
        const saleRevenue = Number(o.total_price);
        const margin = saleRevenue - baseCost;
        if (margin >= 0) totalProfit += margin;
        else totalLoss += Math.abs(margin);

        const month = new Date(o.created_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        if (!monthMap[month]) monthMap[month] = { profit: 0, loss: 0 };
        if (margin >= 0) monthMap[month].profit += margin;
        else monthMap[month].loss += Math.abs(margin);
      });

      // Pie chart: Materials Purchased vs Sold vs Profit vs Loss
      const totalQtyPurchased = orders.reduce((s: number, o: any) => s + Number(o.quantity), 0);
      setPieData([
        { label: 'Revenue', value: revenue, color: 'hsl(var(--primary))' },
        { label: 'Total Profit', value: totalProfit, color: '#22c55e' },
        { label: 'Total Loss', value: totalLoss, color: '#ef4444' },
        { label: 'Units Sold', value: totalQtyPurchased, color: 'hsl(var(--secondary-foreground) / 0.4)' },
      ].filter(s => s.value > 0));

      // Monthly P&L bars (last 6 months)
      const monthlyArr = Object.entries(monthMap)
        .map(([month, d]) => ({ month, ...d }))
        .slice(-6);
      setMonthlyPnL(monthlyArr);

      setStats({ totalRevenue: revenue, orderCount: orders.length, avgOrderValue: orders.length > 0 ? revenue / orders.length : 0, customers: uniqueCustomers, totalProfit, totalLoss });
    } catch (e: any) {
      toast.error('Failed to load analytics: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue > 100000 ? `${(stats.totalRevenue/100000).toFixed(1)}L` : stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
    { title: 'Orders', value: stats.orderCount.toString(), icon: ShoppingCart, color: 'text-foreground' },
    { title: 'Total Profit', value: `₹${stats.totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-success' },
    { title: 'Total Loss', value: `₹${stats.totalLoss.toLocaleString()}`, icon: TrendingDown, color: 'text-destructive' },
    { title: 'Avg. Order Value', value: `₹${Math.round(stats.avgOrderValue).toLocaleString()}`, icon: ArrowUpRight, color: 'text-foreground' },
    { title: 'Unique Customers', value: stats.customers.toString(), icon: Users, color: 'text-foreground' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance, profit & loss, and revenue trends</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <p className="text-xs text-muted-foreground truncate">{metric.title}</p>
                </div>
                <p className={`text-xl font-bold ${metric.color}`}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue, profit, loss, and units sold distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <PieChart segments={pieData} />
              )}
            </CardContent>
          </Card>

          {/* Monthly P&L Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit & Loss</CardTitle>
              <CardDescription>Green = profit earned, Red = loss incurred per month</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <DualBarChart data={monthlyPnL} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
