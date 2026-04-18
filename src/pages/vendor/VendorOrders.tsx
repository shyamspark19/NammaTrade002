import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Clock, ChevronRight, ChevronDown, Loader2, User, ShoppingBag, Phone, Mail, XCircle, Truck, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  accepted: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function VendorOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id,
          quantity,
          total_price,
          status,
          created_at,
          profiles!orders_buyer_id_fkey ( full_name, email, phone ),
          products ( name, category, retail_mrp, wholesale_price )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      toast.error('Failed to load orders: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await (supabase.from('orders' as any) as any)
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    } catch (e: any) {
      toast.error('Failed to update status: ' + e.message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    handleUpdateStatus(orderId, 'cancelled');
  };

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.profiles?.full_name || '').toLowerCase().includes(q) ||
      (o.products?.name || '').toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage incoming consumer orders — click any order for details</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, buyer, or product..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">No orders yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              When a consumer purchases your items, the order will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const isExpanded = expandedId === order.id;
              const unitPrice = order.quantity > 0 ? (Number(order.total_price) / order.quantity).toFixed(2) : order.total_price;

              return (
                <Card key={order.id} className={`transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-primary/30' : 'hover:shadow-md'}`}>
                  {/* Summary Row */}
                  <CardContent
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold font-mono text-sm">{order.id.split('-')[0].toUpperCase()}</p>
                        <Badge variant="outline" className={statusColors[order.status] || statusColors.pending}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">
                        {order.products?.name} × {order.quantity} &nbsp;·&nbsp; <span className="font-medium text-foreground">{order.profiles?.full_name || 'Unknown Buyer'}</span> <span className="text-xs">({order.profiles?.email || 'No Email'})</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-primary">₹{order.total_price}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    }
                  </CardContent>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 bg-muted/30 rounded-b-lg animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Consumer Info */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <User className="h-3 w-3" /> Consumer Details
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">{order.profiles?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{order.profiles?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{order.profiles?.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" /> Order Breakdown
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Material</span>
                              <span className="font-medium">{order.products?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category</span>
                              <span>{order.products?.category || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantity</span>
                              <span className="font-medium">{order.quantity} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Unit Price</span>
                              <span>₹{unitPrice}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                              <span className="font-semibold">Total</span>
                              <span className="font-bold text-primary">₹{order.total_price}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div className="md:col-span-2 border-t border-border pt-4 flex justify-end gap-2">
                            {order.status === 'pending' && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                              >
                                <Package className="h-4 w-4" />
                                Accept Order
                              </Button>
                            )}
                            {order.status === 'processing' && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              >
                                <Truck className="h-4 w-4" />
                                Mark as Shipped
                              </Button>
                            )}
                            {order.status === 'shipped' && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Mark as Delivered
                              </Button>
                            )}
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel Order
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
