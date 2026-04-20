import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download, Eye, Package, Clock, CheckCircle, XCircle, CheckCircle2 } from 'lucide-react';
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
import { User, Mail, Phone, ShoppingBag, Truck, Receipt } from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  delivered: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  shipped: { color: 'bg-primary/10 text-primary border-primary/20', icon: Truck },
  packed: { color: 'bg-accent/10 text-accent-foreground border-accent/20', icon: Package },
  processing: { color: 'bg-secondary/10 text-secondary-foreground border-secondary/20', icon: Clock },
  cancelled: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  pending: { color: 'bg-muted text-muted-foreground', icon: Clock },
};

export default function WarehouseOrders() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, order_type, quantity, total_price,
          buyer_id,
          product_id,
          profiles!orders_buyer_id_fkey(full_name, email, phone),
          products(name, retail_mrp, retail_mop)
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleApproveOrder = async (order: any) => {
    const toastId = toast.loading('Finalizing order approval...');
    try {
      // We now delegate the heavy lifting (stock transfer and status updates) 
      // to a secure database function. This solves the RLS permissions issues
      // and ensures atomic updates.
      const { error } = await supabase.rpc('process_order_approval', { 
        p_order_id: order.id 
      });
      
      if (error) throw error;

      toast.success('Order approved successfully!', { id: toastId });
      fetchOrders();
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error('Approval failed: ' + err.message, { id: toastId });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const { error } = await (supabase.from('orders' as any) as any)
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh the list
    } catch (err: any) {
      toast.error('Failed to cancel order: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    // Create CSV content
    const headers = ['Order ID', 'Buyer Name', 'Product', 'Quantity', 'Type', 'Amount', 'Status', 'Date'];
    const csvRows = [headers.join(',')];
    
    orders.forEach(order => {
      const row = [
        `WH-${order.id.substring(0,8)}`,
        `"${order.profiles?.full_name || 'Unknown'}"`,
        `"${order.products?.name || 'Unknown Product'}"`,
        order.quantity,
        order.order_type,
        order.total_price,
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
    link.setAttribute('download', `warehouse_orders_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(order => {
    const searchString = `${order.id} ${order.profiles?.full_name} ${order.products?.name}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const orderCounts = {
    all: orders.length,
    processing: orders.filter(o => o.status === 'processing').length,
    packed: orders.filter(o => o.status === 'packed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage and process warehouse orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orderCounts.all}</div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{orderCounts.processing}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orderCounts.packed}</div>
              <p className="text-xs text-muted-foreground">Packed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orderCounts.shipped}</div>
              <p className="text-xs text-muted-foreground">Shipped</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{orderCounts.delivered}</div>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Process, pack, and ship orders</CardDescription>
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({orderCounts.all})</TabsTrigger>
                  <TabsTrigger value="processing">Processing ({orderCounts.processing})</TabsTrigger>
                  <TabsTrigger value="packed">Packed ({orderCounts.packed})</TabsTrigger>
                  <TabsTrigger value="shipped">Shipped ({orderCounts.shipped})</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered ({orderCounts.delivered})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || statusConfig.pending.icon;
                    const statusColor = statusConfig[order.status]?.color || statusConfig.pending.color;
                    
                    return (
                      <TableRow key={order.id} className="group">
                        <TableCell className="font-mono font-medium">WH-{order.id.substring(0,6)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm text-foreground">{order.profiles?.full_name || 'System User'}</span>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{order.profiles?.email || 'No Email'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{order.profiles?.phone || 'No Phone'}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] w-fit mt-1 px-1 py-0 h-4 bg-muted/30">
                              {order.order_type === 'wholesale' ? 'Procurement' : 'Consumer Retail'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={order.order_type === 'wholesale' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}>
                            {order.order_type || 'Retail'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{order.products?.name || 'Unknown Product'}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell className="font-medium">₹{order.total_price}</TableCell>
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
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-success hover:bg-success/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleApproveOrder(order)}
                                title="Approve Request"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCancelOrder(order.id)}
                                title="Cancel Order"
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
              Order Details
            </DialogTitle>
            <DialogDescription className="font-mono">
              WH-{selectedOrder?.id.substring(0, 12).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Buyer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-muted/40 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Buyer Information
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{selectedOrder?.profiles?.full_name || 'System User'}</p>
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
                  <Truck className="h-3 w-3" /> Logistics Context
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <Badge variant="outline" className="text-[10px] capitalize font-medium">{selectedOrder?.order_type || 'Retail'}</Badge>
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

            {/* Product Table */}
            <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>Material & Details</span>
                <span>Subtotal</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{selectedOrder?.products?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder?.quantity} units @ ₹{(Number(selectedOrder?.total_price || 0) / Number(selectedOrder?.quantity || 1)).toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-sm">₹{selectedOrder?.total_price}</p>
                </div>
                
                <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Receipt className="h-4 w-4" />
                    <span>Total Value</span>
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
