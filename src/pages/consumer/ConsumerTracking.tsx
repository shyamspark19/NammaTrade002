import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, MapPin, Clock, Loader2, PackageSearch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ConsumerTracking() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchShipments();
  }, [user]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('orders' as any) as any)
        .select(`
          id, status, created_at, quantity, total_price,
          profiles!orders_seller_id_fkey ( full_name ),
          products ( name )
        `)
        .eq('buyer_id', user?.id)
        .not('status', 'eq', 'delivered')   // Active only
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setShipments(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load tracking data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSteps = (status: string, createdAt: string) => {
    const isMatched = (targetStatus: string) => {
      const hierarchy = ['pending', 'processing', 'shipped', 'in_transit', 'delivered'];
      const targetIdx = hierarchy.indexOf(targetStatus);
      const currentIdx = hierarchy.indexOf(status);
      return currentIdx >= targetIdx;
    };

    return [
      { label: 'Order Placed', date: new Date(createdAt).toLocaleDateString(), done: true },
      { label: 'Packed', date: isMatched('processing') ? 'Done' : '', done: isMatched('processing') },
      { label: 'Shipped', date: isMatched('shipped') ? 'Done' : '', done: isMatched('shipped') },
      { label: 'Out for Delivery', date: isMatched('in_transit') ? 'Done' : '', done: isMatched('in_transit') },
      { label: 'Delivered', date: isMatched('delivered') ? 'Done' : '', done: isMatched('delivered') },
    ];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Order Tracking</h1>
          <p className="text-muted-foreground mt-1">Track your active shipments dynamically</p>
        </div>

        <div className="space-y-6">
          {loading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : shipments.length === 0 ? (
             <div className="text-center py-16 bg-muted/20 rounded-lg">
                <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-foreground">No tracking available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  You don't have any active tracking updates. Place an order to see it here!
                </p>
             </div>
          ) : (
            shipments.map((shipment) => {
              const steps = getSteps(shipment.status, shipment.created_at);
              const currentStep = steps.filter(s => s.done).length - 1;
              const progress = ((currentStep < 0 ? 0 : currentStep) / (steps.length - 1)) * 100;

              return (
                <Card key={shipment.id} className="opacity-90 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                    <CardTitle className="text-lg">{shipment.products?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <span>{shipment.id.split('-')[0]} · {shipment.profiles?.full_name}</span>
                      <span className="text-foreground font-semibold">{shipment.quantity} units</span>
                      <span className="text-primary font-bold">₹{shipment.total_price}</span>
                    </CardDescription>
                  </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{shipment.status.replace('_', ' ').toUpperCase()}</Badge>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          Updated Daily
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
                      <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    {/* Steps */}
                    <div className="flex justify-between relative">
                      {steps.map((step, i) => (
                        <div key={step.label} className="flex flex-col items-center text-center flex-1">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${
                            step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.done ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : i === currentStep + 1 ? (
                              <Truck className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                          </div>
                          <p className={`text-xs font-medium max-sm:text-[9px] ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{step.date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
