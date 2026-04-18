import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Package, Store, Warehouse, Shield } from 'lucide-react';

const roles = [
  {
    id: 'consumer' as const,
    label: 'Consumer',
    description: 'Browse and purchase products from vendors',
    icon: Package,
  },
  {
    id: 'vendor' as const,
    label: 'Vendor',
    description: 'Sell products and manage your storefront',
    icon: Store,
  },
  {
    id: 'warehouse' as const,
    label: 'Warehouse Distributor',
    description: 'Manage inventory, tracking and distribution',
    icon: Warehouse,
  },
  {
    id: 'admin' as const,
    label: 'Admin',
    description: 'Full platform management and oversight',
    icon: Shield,
  },
];

export default function RoleSelection() {
  const { user, refreshRoles } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: selected as any });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await refreshRoles();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-[family-name:var(--font-display)]">
            Who are you?
          </h1>
          <p className="text-muted-foreground">
            Choose your role to get started on NAMMA TRADE
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <Card
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-foreground">{role.label}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selected || loading}
            onClick={handleConfirm}
            className="min-w-[200px]"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
