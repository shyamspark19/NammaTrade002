import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Trash2, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PaymentSettings() {
  const [methods, setMethods] = useState([
    { id: 1, type: 'Card', last4: '4242', expiry: '12/28', bank: 'HDFC Bank' },
    { id: 2, type: 'UPI', address: 'user@okhdfcbank', bank: 'Google Pay' }
  ]);

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Feature mocked for Phase 1. Payment gateway integration required.');
  };

  const handleRemove = (id: number) => {
    setMethods(methods.filter(m => m.id !== id));
    toast.info('Payment method unlinked successfully.');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">Manage your saved cards, UPI IDs, and billing preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Saved Methods</h3>
            {methods.length === 0 ? (
               <p className="text-muted-foreground text-sm">No saved payment methods.</p>
            ) : (
              methods.map((method) => (
                <Card key={method.id} className="relative overflow-hidden group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        {method.type === 'Card' ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold">{method.bank} {method.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.type === 'Card' ? `**** **** **** ${method.last4}` : method.address}
                        </p>
                        {method.expiry && <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemove(method.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            <form onSubmit={handleAddMethod}>
              <Card>
                <CardHeader>
                  <CardTitle>Add New Payment Method</CardTitle>
                  <CardDescription>Securely link a new card or UPI ID for seamless checkouts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name on Card / Account</Label>
                    <Input placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Card Number or UPI ID</Label>
                    <Input placeholder="0000-0000-0000-0000 or user@upi" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry (MM/YY)</Label>
                      <Input placeholder="12/28" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input type="password" placeholder="***" maxLength={4} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Link Payment Method
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
