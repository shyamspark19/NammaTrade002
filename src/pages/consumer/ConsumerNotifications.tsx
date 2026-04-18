import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type NotifType = 'placed' | 'shipped' | 'delivered' | 'cancelled' | 'processing';

const notifConfig: Record<NotifType, { icon: any; color: string; label: string }> = {
  placed:     { icon: Package,      color: 'bg-primary/10 text-primary',       label: 'Order Placed' },
  processing: { icon: Clock,        color: 'bg-secondary/10 text-secondary-foreground', label: 'Being Prepared' },
  shipped:    { icon: Truck,        color: 'bg-secondary/10 text-secondary-foreground', label: 'Shipped' },
  delivered:  { icon: CheckCircle, color: 'bg-success/10 text-success',         label: 'Delivered' },
  cancelled:  { icon: XCircle,     color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
};

export default function ConsumerNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, quantity, total_price,
          products ( name, category )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Each order generates one notification based on its current status
      const notifs = (data || []).map((order: any) => {
        const statusKey = (['placed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(order.status)
          ? order.status : 'placed') as NotifType;

        const derivedType: NotifType = order.status === 'pending' ? 'placed' : order.status as NotifType;

        return {
          id: order.id,
          type: derivedType,
          title: notifConfig[derivedType]?.label || 'Order Update',
          message: `${order.products?.name} × ${order.quantity} — ₹${order.total_price}`,
          category: order.products?.category,
          time: order.created_at,
        };
      });

      setNotifications(notifs);
    } catch (e: any) {
      toast.error('Failed to load notifications: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const min = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.round(hr / 24)}d ago`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">Live updates about your orders and purchases</p>
          </div>
          {!loading && (
            <Badge variant="outline" className="gap-1">
              <Bell className="h-3.5 w-3.5" />
              {notifications.length} updates
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-medium text-foreground">No notifications yet</h3>
              <p className="text-muted-foreground mt-2">When you place orders, your updates will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Order Activity
              </CardTitle>
              <CardDescription>Your most recent order events</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {notifications.map((notif) => {
                  const cfg = notifConfig[notif.type as NotifType] || notifConfig.placed;
                  const Icon = cfg.icon;
                  return (
                    <div key={notif.id} className="flex items-start gap-4 p-4 hover:bg-muted/40 transition-colors">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{notif.title}</p>
                          {notif.category && (
                            <Badge variant="outline" className="text-[9px] px-1.5">{notif.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(notif.time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
