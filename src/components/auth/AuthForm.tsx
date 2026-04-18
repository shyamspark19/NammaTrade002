import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Phone, Loader2, ArrowRight, ArrowLeft, Package, Store, Warehouse, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/procurement-hero.jpg';
import marketBg from '@/assets/consumer-bg.jpg';
import spicesBg from '@/assets/admin-bg.jpg';

const roles = [
  { id: 'consumer' as const, label: 'Consumer', description: 'Browse and purchase products from vendors', icon: Package },
  { id: 'vendor' as const, label: 'Vendor', description: 'Sell products and manage your storefront', icon: Store },
  { id: 'warehouse' as const, label: 'Warehouse Distributor', description: 'Manage inventory, tracking and distribution', icon: Warehouse },
  { id: 'admin' as const, label: 'Admin', description: 'Full platform management and oversight', icon: Shield },
];

const PageBg = ({ src }: { src: string }) => (
  <div className="fixed inset-0 -z-10">
    <img src={src} alt="" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-foreground/75 backdrop-blur-sm" />
  </div>
);

export function AuthForm() {
  const { signIn, signUp, refreshRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<'signin' | 'role-select' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, formData.fullName, selectedRole);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Now wait for the session or user to be confirmed. The trigger in Supabase
    // will have handled adding the role via user_metadata!
    await refreshRoles();

    toast.success('Account created successfully!');
    setLoading(false);
  };

  // Role selection step for signup
  if (step === 'role-select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <PageBg src={marketBg} />
        <div className="w-full max-w-2xl relative space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-glow p-3">
              <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-foreground font-[family-name:var(--font-display)]">
              Who are you?
            </h1>
            <p className="text-primary-foreground/70">Choose your role to get started on NAMMA TRADE</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <Card
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md bg-card/90 backdrop-blur-md ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-foreground">{role.label}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setStep('signin')} className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              size="lg"
              disabled={!selectedRole}
              onClick={() => setStep('signup')}
              className="min-w-[200px]"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Signup form (after role selected)
  if (step === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <PageBg src={spicesBg} />
        <Card className="w-full max-w-md relative shadow-2xl border-border/50 bg-card/90 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-glow p-3">
              <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
            </div>
            <div>
              <CardTitle className="text-3xl font-display font-bold">Create Account</CardTitle>
              <CardDescription className="text-base mt-2">
                Signing up as <span className="font-semibold text-primary">{roles.find(r => r.id === selectedRole)?.label}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-name" type="text" placeholder="John Doe" className="pl-10"
                    value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-email" type="email" placeholder="Use demo@namma.com to bypass" className="pl-10"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-phone" type="tel" placeholder="+91 98765 43210" className="pl-10"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-password" type="password" placeholder="••••••••" className="pl-10"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('role-select')} className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="submit" className="w-full h-11 gradient-primary font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Sign In view
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <PageBg src={heroBg} />
      <Card className="w-full max-w-md relative shadow-2xl border-border/50 bg-card/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-glow p-3">
            <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-3xl font-display font-bold">NAMMA TRADE</CardTitle>
            <CardDescription className="text-base mt-2">Your complete procurement platform</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="signin-email" type="email" placeholder="you@example.com" className="pl-10"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="signin-password" type="password" placeholder="••••••••" className="pl-10"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gradient-primary font-medium" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button onClick={() => setStep('role-select')} className="text-primary font-medium hover:underline">
                Sign Up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
