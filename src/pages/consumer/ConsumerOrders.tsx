import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Clock, ChevronRight, ChevronDown, Store, Loader2, SearchX, User, ShoppingBag, Phone, Mail, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary border-primary/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_FILTERS = ['All', 'pending', 'processing', 'shipped', 'delivered'];

export default function ConsumerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, quantity, total_price, status, created_at,
          profiles!orders_seller_id_fkey ( full_name, email, phone ),
          products ( name, category, retail_mrp )
        `)
        .eq('buyer_id', user?.id)
        .not('status', 'eq', 'cancelled')   // Never show cancelled orders
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      toast.error('Failed to load orders: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (order: any) => {
    // Optimistic: remove from UI immediately
    setOrders(prev => prev.filter(o => o.id !== order.id));
    setExpandedId(null);
    setCancellingId(order.id);
    try {
      const { error } = await (supabase.from('orders' as any) as any)
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('buyer_id', user?.id);
      if (error) throw error;
      toast.success('Order cancelled successfully.');
    } catch (e: any) {
      // Revert: refetch to restore original state
      fetchOrders();
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      (o.products?.name || '').toLowerCase().includes(q) ||
      (o.profiles?.full_name || '').toLowerCase().includes(q);
    const matchesStatus = activeStatus === 'All' || o.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">Track your purchases — click any order to see details</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, vendor, or order ID..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeStatus === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {status === 'All' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg">
            <SearchX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">No orders found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const isExpanded = expandedId === order.id;
              const unitPrice = order.quantity > 0 ? (Number(order.total_price) / order.quantity).toFixed(2) : order.total_price;

              return (
                <Card key={order.id} className={`transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-primary/30' : 'hover:shadow-md'}`}>
                  {/* Summary row */}
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold font-mono text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
                        <Badge variant="outline" className={statusColors[order.status] || ''}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-foreground font-medium truncate">{order.products?.name} × {order.quantity}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                        <Store className="h-3.5 w-3.5" />
                        Sold by {order.profiles?.full_name || order.profiles?.email || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
                      <p className="font-bold text-xl text-primary">₹{order.total_price}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                      : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                    }
                  </CardContent>

                    {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 bg-muted/30 rounded-b-lg animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vendor Info */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <User className="h-3 w-3" /> Vendor / Seller
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{order.profiles?.full_name || 'Unknown'}</span></div>
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{order.profiles?.email || 'N/A'}</span></div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{order.profiles?.phone || 'N/A'}</span></div>
                          </div>
                        </div>
                        {/* Order Breakdown */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" /> Order Breakdown
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Material</span><span className="font-medium">{order.products?.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{order.products?.category || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{order.quantity} units</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Unit Price</span><span>₹{unitPrice}</span></div>
                            <div className="flex justify-between border-t border-border pt-1.5">
                              <span className="font-semibold">Total Paid</span>
                              <span className="font-bold text-primary">₹{order.total_price}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Button — only for pending/processing */}
                      {['pending', 'processing'].includes(order.status) && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2 w-full sm:w-auto"
                            disabled={cancellingId === order.id}
                            onClick={() => cancelOrder(order)}
                          >
                            {cancellingId === order.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <XCircle className="h-4 w-4" />
                            }
                            Cancel Order
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">Orders can only be cancelled before they are shipped.</p>
                        </div>
                      )}
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
