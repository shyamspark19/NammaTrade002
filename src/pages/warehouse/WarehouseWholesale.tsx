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
import { Search, Filter, Download, Eye, Warehouse, Clock, CheckCircle, XCircle, Package, TrendingUp, ArrowUpRight, User, Mail, Phone, ShoppingBag, Truck as TruckIcon, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  delivered: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  shipped: { color: 'bg-primary/10 text-primary border-primary/20', icon: Package },
  processing: { color: 'bg-secondary text-secondary-foreground', icon: Clock },
  pending: { color: 'bg-muted text-muted-foreground', icon: Clock },
  cancelled: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export default function WarehouseWholesale() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) fetchWholesaleOrders();
  }, [user]);

  const fetchWholesaleOrders = async () => {
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, quantity, total_price,
          profiles!orders_buyer_id_fkey(full_name, email, phone),
          products(name, base_price)
        `)
        .eq('seller_id', user?.id)
        .gt('quantity', 40)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching wholesale orders:", err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this bulk order?')) return;
    try {
      const { error } = await (supabase.from('orders' as any) as any)
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Wholesale order cancelled');
      fetchWholesaleOrders();
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    // Create Advanced CSV content
    const headers = ['Order ID', 'Username', 'Email', 'Phone', 'Bought Product', 'Quantity Sold', 'Base Cost', 'Revenue', 'Profit', 'Loss', 'Status', 'Date'];
    const csvRows = [headers.join(',')];
    
    orders.forEach(order => {
      const email = order.profiles?.email || 'N/A';
      const phone = order.profiles?.phone || 'N/A';
      const basePrice = order.products?.base_price || 0;
      const totalCost = basePrice * order.quantity;
      const revenue = order.total_price || 0;
      const margin = revenue - totalCost;
      
      const profit = margin >= 0 ? margin : 0;
      const loss = margin < 0 ? Math.abs(margin) : 0;

      const row = [
        `WSO-${order.id.substring(0,8)}`,
        `"${order.profiles?.full_name || 'Unknown'}"`,
        `"${email}"`,
        `"${phone}"`,
        `"${order.products?.name || 'Unknown Product'}"`,
        order.quantity,
        totalCost,
        revenue,
        profit,
        loss,
        order.status,
        new Date(order.created_at).toLocaleDateString('en-IN')
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wholesale_orders_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = orders.filter(o => {
    const searchString = `${o.id} ${o.profiles?.full_name} ${o.products?.name}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const totalValue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);
  const formattedTotalValue = totalValue > 10000000 ? `₹${(totalValue/10000000).toFixed(2)}Cr` :
                              totalValue > 100000 ? `₹${(totalValue/100000).toFixed(2)}L` : `₹${totalValue}`;

  const avgOrderSize = orders.length > 0 ? totalValue / orders.length : 0;
  const formattedAvgSize = avgOrderSize > 100000 ? `₹${(avgOrderSize/100000).toFixed(2)}L` : `₹${Math.round(avgOrderSize)}`;

  const stats = {
    totalOrders: orders.length,
    totalValue: formattedTotalValue,
    avgOrderSize: formattedAvgSize,
    activeOrders: orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Wholesale Orders</h1>
            <p className="text-muted-foreground mt-1">Manage bulk orders and wholesale distribution</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
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
                  <div className="text-2xl font-bold">{stats.totalValue}</div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <ArrowUpRight className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgOrderSize}</div>
                  <p className="text-xs text-muted-foreground">Avg Order Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Wholesale Order Log</CardTitle>
                <CardDescription>Bulk orders and fulfillment tracking</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search wholesale orders..."
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
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No wholesale orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || statusConfig.pending.icon;
                    const statusColor = statusConfig[order.status]?.color || statusConfig.pending.color;
                    
                    return (
                      <TableRow key={order.id} className="group">
                        <TableCell className="font-mono font-medium">WSO-{order.id.substring(0,6)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.profiles?.full_name || 'Unknown Vendor'}</span>
                            <span className="text-[10px] text-muted-foreground">{order.profiles?.email || 'No Email'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[180px] truncate">{order.products?.name}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell className="font-semibold">₹{order.total_price}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCancelOrder(order.id)}
                                title="Cancel Bulk Order"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Wholesale Order Details
            </DialogTitle>
            <DialogDescription className="font-mono">
              WSO-{selectedOrder?.id.substring(0, 12).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Vendor Partner
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{selectedOrder?.profiles?.full_name || 'Unknown Vendor'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground group">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selectedOrder?.profiles?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{selectedOrder?.profiles?.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <TruckIcon className="h-3 w-3" /> Bulk Distribution
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Classification</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">Wholesale</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge className={`text-[10px] capitalize font-semibold ${statusConfig[selectedOrder?.status || 'pending']?.color}`}>
                      {selectedOrder?.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>Bulk Material</span>
                <span>Wholesale Value</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{selectedOrder?.products?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder?.quantity} units bulk lot</p>
                  </div>
                  <p className="font-bold text-sm">₹{selectedOrder?.total_price}</p>
                </div>
                
                <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Receipt className="h-4 w-4" />
                    <span>Total Distribution Revenue</span>
                  </div>
                  <span className="text-lg font-black text-primary">₹{selectedOrder?.total_price}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
