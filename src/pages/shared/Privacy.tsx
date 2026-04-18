import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Lock, Eye, Server } from 'lucide-react';

export default function Privacy() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center py-6">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-display font-bold">Privacy Guidelines</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            At NammaTrade, we take your data security seriously. Below is an outline of how your information is handled within our architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All PII (Personally Identifiable Information) including your addresses, phone numbers, and payment details are strictly encrypted in transit via SSL/TLS and at rest within our secured database clusters.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Data Access & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We implement strict Row Level Security (RLS) policies. Your activity logs, order histories, and profile configurations are strictly clamped down; meaning only you, the verified user, can run a database query targeting them.
              </p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Third-Party Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground space-y-2">
                <strong>Warehouse & Delivery:</strong> Specific vendors and verified warehouse personnel are grated temporary viewing tokens to process your delivery addresses solely for fulfillment. <br/><br/>
                We will never sell or syndicate your direct contact pathways to third-party ad platforms. If you wish to purge your NammaTrade account data, please navigate to the Support menu to initiate a data takedown request.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
