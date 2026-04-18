import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Store, Warehouse, Shield, Truck, BarChart3, Globe, HeadphonesIcon, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/procurement-hero.jpg';


const features = [
  {
    icon: Package,
    title: 'Smart Procurement',
    description: 'Streamlined ordering from vendors to consumers with real-time tracking.',
  },
  {
    icon: Warehouse,
    title: 'Warehouse Management',
    description: 'Efficient inventory control, wholesale & retail distribution.',
  },
  {
    icon: Store,
    title: 'Vendor Storefront',
    description: 'Manage products, pricing, and analytics from a single dashboard.',
  },
  {
    icon: Truck,
    title: 'Live Tracking',
    description: 'Track every shipment from origin to delivery in real time.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Data-driven decisions with comprehensive reporting tools.',
  },
  {
    icon: Globe,
    title: 'Multi-Role Platform',
    description: 'One platform for admins, warehouses, vendors, and consumers.',
  },
];

const roles = [
  { icon: Shield, label: 'Admin', desc: 'Full platform oversight & management' },
  { icon: Warehouse, label: 'Warehouse', desc: 'Inventory & distribution control' },
  { icon: Store, label: 'Vendor', desc: 'Product & sales management' },
  { icon: Package, label: 'Consumer', desc: 'Browse, order & track purchases' },
];

export default function Home() {
  return (
    <div className="min-h-screen relative w-full selection:bg-primary/30">
      {/* Fixed Global Background */}
      <div className="fixed inset-0 w-full h-full z-[-1] pointer-events-none bg-black">
        <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-50 transition-opacity duration-1000" />
        <div className="absolute inset-0 bg-foreground/85 backdrop-blur-sm" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5">
              <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary-foreground font-[family-name:var(--font-display)]">NAMMA TRADE</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>
            <a href="#roles" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Roles</a>
            <Link to="/support" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Support</Link>
            <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Terms</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20 backdrop-blur-md">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center relative">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 border border-primary/30 backdrop-blur-md">
            Your Complete Procurement Platform
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary-foreground font-[family-name:var(--font-display)] leading-tight">
            Trade Smarter with<br />
            <span className="text-primary">NAMMA TRADE</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            A unified platform connecting admins, warehouses, vendors, and consumers — 
            powering seamless procurement, distribution, and commerce.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg">
                Start Trading <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20 backdrop-blur-md">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground font-[family-name:var(--font-display)]">
              Everything You Need
            </h2>
            <p className="mt-4 text-primary-foreground/70 text-lg max-w-xl mx-auto">
              Built for every step of the supply chain, from sourcing to delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 bg-card/90 backdrop-blur-md border-border/50">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground font-[family-name:var(--font-display)]">
              One Platform, Four Roles
            </h2>
            <p className="mt-4 text-primary-foreground/70 text-lg max-w-xl mx-auto">
              Every stakeholder gets a tailored dashboard experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.label} className="text-center hover:shadow-lg transition-all duration-300 bg-card/90 backdrop-blur-md border-border/50">
                  <CardContent className="p-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{r.label}</h3>
                    <p className="text-muted-foreground text-sm">{r.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-background/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1">
                <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-primary-foreground font-[family-name:var(--font-display)]">NAMMA TRADE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-primary-foreground/80">
              <Link to="/support" className="hover:text-primary-foreground transition-colors flex items-center gap-1">
                <HeadphonesIcon className="h-4 w-4" /> Support
              </Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms & Conditions</Link>
            </div>
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Namma Trade. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
