import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, LifeBuoy, User } from 'lucide-react';
import heroBg from '@/assets/procurement-hero.jpg';
import marketBg from '@/assets/consumer-bg.jpg';
import adminBg from '@/assets/admin-bg.jpg';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up real-time listener if the user is a warehouse user
    if (!roles.includes('warehouse')) return;

    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          const newProduct = payload.new;
          if (newProduct.status === 'active') {
            toast('New Global Product Added!', {
              description: `${newProduct.name} (${newProduct.category})`,
              duration: 10000,
              action: {
                label: 'Add to Inventory',
                onClick: () => navigate(`/warehouse/inventory?newProduct=${newProduct.id}`)
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roles, navigate]);

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getBgImage = () => {
    if (roles.includes('admin')) return adminBg;
    if (roles.includes('warehouse')) return marketBg;
    if (roles.includes('vendor')) return heroBg;
    return heroBg; // consumer or fallback
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        {/* Fixed Background Image for Dashboard */}
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <img src={getBgImage()} alt="Dashboard Background" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-[6px]" />
        </div>

        <div className="relative z-10 flex w-full">
          <AppSidebar />

          <div className="flex-1 flex flex-col bg-transparent backdrop-blur-sm">
            {/* Top Header */}
            <header className="h-16 border-b border-white/10 dark:border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
                <div className="hidden md:block">
                  <h2 className="font-display font-semibold text-lg">WELCOME TO NAMMATRADE ♥</h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="gradient-primary text-primary-foreground font-medium">
                          {getInitials(profile?.full_name ?? null, user?.email ?? null)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer">
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
