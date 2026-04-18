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
import { Search, MapPin, Truck, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const shipments = [
  { id: 'SHP-3021', orderId: 'WH-5012', carrier: 'BlueDart', origin: 'Mumbai WH', destination: 'Hyderabad', status: 'in_transit', eta: 'Jan 17', lastUpdate: 'Reached Pune Hub', progress: 60 },
  { id: 'SHP-3020', orderId: 'WH-5011', carrier: 'Delhivery', origin: 'Mumbai WH', destination: 'Bengaluru', status: 'in_transit', eta: 'Jan 16', lastUpdate: 'Out for delivery', progress: 90 },
  { id: 'SHP-3019', orderId: 'WH-5010', carrier: 'DTDC', origin: 'Delhi WH', destination: 'Chennai', status: 'delayed', eta: 'Jan 18', lastUpdate: 'Delayed at sorting facility', progress: 35 },
  { id: 'SHP-3018', orderId: 'WH-5009', carrier: 'BlueDart', origin: 'Mumbai WH', destination: 'Pune', status: 'delivered', eta: 'Jan 14', lastUpdate: 'Delivered to customer', progress: 100 },
  { id: 'SHP-3017', orderId: 'WH-5008', carrier: 'Ecom Express', origin: 'Delhi WH', destination: 'Jaipur', status: 'picked_up', eta: 'Jan 19', lastUpdate: 'Picked up from warehouse', progress: 15 },
  { id: 'SHP-3016', orderId: 'WH-5006', carrier: 'Delhivery', origin: 'Mumbai WH', destination: 'Kolkata', status: 'delivered', eta: 'Jan 12', lastUpdate: 'Delivered to customer', progress: 100 },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  picked_up: { label: 'Picked Up', color: 'bg-secondary text-secondary-foreground', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-primary/10 text-primary border-primary/20', icon: Truck },
  delayed: { label: 'Delayed', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  delivered: { label: 'Delivered', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
};

export default function WarehouseTracking() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = shipments.filter(s =>
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trackingStats = {
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pickedUp: shipments.filter(s => s.status === 'picked_up').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Shipment Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor and track all shipments in real-time</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{trackingStats.inTransit}</div>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{trackingStats.delayed}</div>
                  <p className="text-xs text-muted-foreground">Delayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{trackingStats.delivered}</div>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{trackingStats.pickedUp}</div>
                  <p className="text-xs text-muted-foreground">Picked Up</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tracking Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Shipments</CardTitle>
                <CardDescription>Track shipment status and delivery progress</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((shipment) => {
                  const config = statusConfig[shipment.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono font-medium">{shipment.id}</TableCell>
                      <TableCell className="text-muted-foreground">{shipment.orderId}</TableCell>
                      <TableCell>{shipment.carrier}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{shipment.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{shipment.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{shipment.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                shipment.status === 'delayed' ? 'bg-destructive' : 'bg-primary'
                              }`}
                              style={{ width: `${shipment.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{shipment.eta}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{shipment.lastUpdate}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
