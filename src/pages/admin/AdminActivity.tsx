import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserPlus, 
  Package, 
  CreditCard, 
  ShoppingCart, 
  Settings, 
  LogIn,
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const activityTypes: Record<string, { icon: React.ElementType; color: string }> = {
  user_registered: { icon: UserPlus, color: 'bg-primary/10 text-primary' },
  order_placed: { icon: ShoppingCart, color: 'bg-secondary/10 text-secondary' },
  package: { icon: Package, color: 'bg-accent/10 text-accent' },
  payment_received: { icon: CreditCard, color: 'bg-success/10 text-success' },
  settings_changed: { icon: Settings, color: 'bg-muted text-muted-foreground' },
  user_login: { icon: LogIn, color: 'bg-primary/10 text-primary' },
  alert: { icon: AlertTriangle, color: 'bg-warning/10 text-warning' },
};

export default function AdminActivity() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ actions: 0, activeUsers: 0, ordersProcessed: 0, alerts: 0 });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // 1. Fetch recent users
      const { data: users } = await (supabase.from('profiles' as any) as any).select('user_id, full_name, created_at').order('created_at', { ascending: false }).limit(10);
      // 2. Fetch recent orders
      const { data: orders } = await (supabase.from('orders' as any) as any).select('id, total_price, order_type, created_at, buyer_id').order('created_at', { ascending: false }).limit(10);
      // 3. Fetch recent products
      const { data: products } = await (supabase.from('products' as any) as any).select('name, created_at, category').order('created_at', { ascending: false }).limit(10);
      
      const activities: any[] = [];
      const profileMap: Record<string, string> = {};
      
      if (users) {
        users.forEach((u: any) => {
          profileMap[u.user_id] = u.full_name || 'Anonymous';
          activities.push({
            id: `u-${u.user_id}`,
            type: 'user_registered',
            message: 'New user registered',
            user: u.full_name || 'Anonymous',
            rawTime: new Date(u.created_at),
            details: 'Account successfully created'
          });
        });
      }
      
      if (orders) {
        orders.forEach((o: any) => activities.push({
          id: `o-${o.id}`,
          type: 'order_placed',
          message: `New ${o.order_type || 'standard'} order`,
          user: profileMap[o.buyer_id] || 'Verified Buyer',
          rawTime: new Date(o.created_at),
          details: `Order value: ₹${o.total_price}`
        }));
      }
      
      if (products) {
        products.forEach((p: any) => activities.push({
          id: `p-${p.name}`,
          type: 'package',
          message: `New product added`,
          user: 'System/Admin',
          rawTime: new Date(p.created_at),
          details: `Item: ${p.name}`
        }));
      }
      
      // Sort completely by time descending
      activities.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());
      
      // Map to relative times string
      const finalFeed = activities.slice(0, 15).map(a => {
        const diffMins = Math.floor((new Date().getTime() - a.rawTime.getTime()) / 60000);
        let niceTime = `${diffMins} min ago`;
        if (diffMins > 1440) niceTime = `${Math.floor(diffMins/1440)} days ago`;
        else if (diffMins > 60) niceTime = `${Math.floor(diffMins/60)} hours ago`;
        else if (diffMins < 1) niceTime = 'Just now';
        
        return { ...a, time: niceTime };
      });
      
      setFeed(finalFeed);
      
      // Basic stats calculation based on real records
      setStats({
        actions: activities.length,
        activeUsers: users?.length || 0,
        ordersProcessed: orders?.length || 0,
        alerts: 0
      });

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Activity Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform activity and events
          </p>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.actions}</div>
              <p className="text-xs text-muted-foreground">Recent Actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">New Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats.ordersProcessed}</div>
              <p className="text-xs text-muted-foreground">Recent Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{stats.alerts}</div>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>All platform events and actions</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse">
                <span className="h-2 w-2 bg-success rounded-full mr-2" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : feed.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No recent activity logged in the system.
              </div>
            ) : (
              <div className="space-y-1">
                {feed.map((activity, index) => {
                  const config = activityTypes[activity.type] || activityTypes.settings_changed;
                  const Icon = config.icon;
                  return (
                    <div
                      key={activity.id + index}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors relative"
                    >
                      {/* Timeline connector */}
                      {index < feed.length - 1 && (
                        <div className="absolute left-9 top-16 w-px h-8 bg-border" />
                      )}
                      
                      <div className={`p-2.5 rounded-full ${config.color} flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{activity.message}</p>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {activity.user ? activity.user.slice(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{activity.user}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
