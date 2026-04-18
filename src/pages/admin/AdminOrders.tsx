import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download, Eye, Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  delivered: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  shipped: { color: 'bg-secondary/10 text-secondary border-secondary/20', icon: Package },
  processing: { color: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
  pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  cancelled: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: orderData, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, order_type, total_price, quantity,
          buyer_id, seller_id,
          products(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles to map names to seller_id and buyer_id
      const { data: profilesData } = await (supabase.from('profiles' as any) as any).select('user_id, full_name');
      const profileMap: Record<string, string> = {};
      if (profilesData) {
        profilesData.forEach((p: any) => {
          profileMap[p.user_id] = p.full_name;
        });
      }

      const mappedOrders = (orderData || []).map((o: any) => ({
        id: o.id,
        customer: profileMap[o.buyer_id] || 'Unknown User',
        vendor: profileMap[o.seller_id] || 'System',
        productName: o.products?.name || 'Unknown Product',
        amount: `₹${Number(o.total_price).toLocaleString()}`,
        status: o.status,
        date: o.created_at,
        type: o.order_type
      }));

      setOrders(mappedOrders);
    } catch (err: any) {
      toast.error('Failed to load real orders: ' + err.message);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    processing: orders.filter(o => ['processing', 'pending', 'shipped'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Order Logs</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all platform orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orderStats.total}</div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{orderStats.delivered}</div>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{orderStats.processing}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{orderStats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Complete order history and logs</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
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
            {loading ? (
              <div className="py-12 flex justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No active platform orders found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  const statusColor = statusConfig[order.status]?.color || 'bg-muted text-muted-foreground';
                  
                  return (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-mono font-medium">{order.id.substring(0,8).toUpperCase()}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{order.vendor}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={order.type === 'wholesale' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}>
                          {order.type || 'standard'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
