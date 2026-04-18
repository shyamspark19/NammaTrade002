import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Download, Filter, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, users: 0 });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: users } = await (supabase.from('profiles' as any) as any).select('created_at');
      const { data: orders } = await (supabase.from('orders' as any) as any).select('created_at, total_price');
      
      const monthsMap: Record<string, any> = {};

      const getMonthStr = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      };

      const normalizeToStartOfMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      };

      if (users) {
        users.forEach((u: any) => {
          const m = getMonthStr(u.created_at);
          if (!monthsMap[m]) monthsMap[m] = { month: m, users: 0, orders: 0, revenue: 0, rawDate: normalizeToStartOfMonth(u.created_at) };
          monthsMap[m].users += 1;
        });
      }

      if (orders) {
        orders.forEach((o: any) => {
          const m = getMonthStr(o.created_at);
          if (!monthsMap[m]) monthsMap[m] = { month: m, users: 0, orders: 0, revenue: 0, rawDate: normalizeToStartOfMonth(o.created_at) };
          monthsMap[m].orders += 1;
          monthsMap[m].revenue += Number(o.total_price || 0);
        });
      }

      // Sort chronological descending
      const historyArr = Object.values(monthsMap).sort((a, b) => b.rawDate - a.rawDate);
      
      // Calculate growth relative to chronologically previous (which is +1 index in descending)
      historyArr.forEach((item: any, i) => {
        const prevMonth = historyArr[i + 1];
        if (prevMonth && prevMonth.revenue > 0) {
          const growth = ((item.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
          item.growth = `${growth >= 0 ? '+' : ''}${Math.round(growth)}%`;
        } else {
          item.growth = '+0%'; // Fallback for oldest month
        }
        
        let label = item.revenue > 100000 ? `₹${(item.revenue/100000).toFixed(2)}L` : `₹${item.revenue.toLocaleString()}`;
        item.formattedRevenue = label;
      });

      setHistory(historyArr);
      
      // Calculate global totals
      setTotals({
        revenue: historyArr.reduce((sum, item) => sum + item.revenue, 0),
        orders: historyArr.reduce((sum, item) => sum + item.orders, 0),
        users: historyArr.reduce((sum, item) => sum + item.users, 0)
      });
      
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatBigCurrency = (val: number) => {
    if (val > 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val > 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">History</h1>
            <p className="text-muted-foreground mt-1">
              Historical data and platform analytics natively driven by your database.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Revenue (All Time)</p>
              <div className="text-3xl font-bold font-display mt-2">{formatBigCurrency(totals.revenue)}</div>
              <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
                <TrendingUp className="h-4 w-4" />
                <span>Live accumulated globally</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Processed Orders</p>
              <div className="text-3xl font-bold font-display mt-2">{totals.orders.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>Total transactions processed</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Users Created</p>
              <div className="text-3xl font-bold font-display mt-2">{totals.users.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>Active platform accounts</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Historical performance dynamically clustered by month</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search month..." className="pl-9 w-48" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No historical data found in the database.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.month}</p>
                        <p className="text-sm text-muted-foreground">{item.users} new users</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Orders</p>
                        <p className="font-semibold">{item.orders.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-bold text-black text-base">{item.formattedRevenue}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={item.growth.startsWith('+') 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {item.growth.startsWith('+') ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {item.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
