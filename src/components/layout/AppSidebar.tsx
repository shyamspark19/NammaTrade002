import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Activity, 
  History,
  Package,
  Truck,
  Store,
  ShoppingCart,
  TrendingUp,
  Bell,
  Settings,
  Warehouse,
  Tags,
  Shield,
  CreditCard,
  Link2,
  ChevronUp,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AppRole = 'admin' | 'warehouse' | 'vendor' | 'consumer';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  // Admin items
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { title: 'Products', url: '/admin/products', icon: Package, roles: ['admin'] },
  { title: 'Users', url: '/admin/users', icon: Users, roles: ['admin'] },
  { title: 'Order Logs', url: '/admin/orders', icon: ClipboardList, roles: ['admin'] },
  { title: 'Activity', url: '/admin/activity', icon: Activity, roles: ['admin'] },
  { title: 'History', url: '/admin/history', icon: History, roles: ['admin'] },
  
  // Warehouse items
  { title: 'Dashboard', url: '/warehouse', icon: LayoutDashboard, roles: ['warehouse'] },
  { title: 'Orders', url: '/warehouse/orders', icon: Package, roles: ['warehouse'] },
  { title: 'Inventory', url: '/warehouse/inventory', icon: Truck, roles: ['warehouse'] },
  { title: 'Vendors', url: '/warehouse/vendors', icon: Store, roles: ['warehouse'] },
  { title: 'Wholesale', url: '/warehouse/wholesale', icon: Warehouse, roles: ['warehouse'] },
  { title: 'Retail', url: '/warehouse/retail', icon: ShoppingCart, roles: ['warehouse'] },
  
  // Vendor items
  { title: 'Dashboard', url: '/vendor', icon: LayoutDashboard, roles: ['vendor'] },
  { title: 'Products', url: '/vendor/products', icon: Package, roles: ['vendor'] },
  { title: 'Pricing', url: '/vendor/pricing', icon: Tags, roles: ['vendor'] },
  { title: 'Orders', url: '/vendor/orders', icon: ClipboardList, roles: ['vendor'] },
  { title: 'Analytics', url: '/vendor/analytics', icon: TrendingUp, roles: ['vendor'] },
  { title: 'Material Shop', url: '/vendor/material', icon: ShoppingBag, roles: ['vendor'] },
  
  // Consumer items
  { title: 'Dashboard', url: '/consumer', icon: LayoutDashboard, roles: ['consumer'] },
  { title: 'Shop', url: '/consumer/shop', icon: ShoppingCart, roles: ['consumer'] },
  { title: 'Orders', url: '/consumer/orders', icon: Package, roles: ['consumer'] },
  { title: 'Tracking', url: '/consumer/tracking', icon: Truck, roles: ['consumer'] },
  { title: 'Notifications', url: '/consumer/notifications', icon: Bell, roles: ['consumer'] },
];

export function AppSidebar() {
  const { roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  // Filter nav items based on user roles
  const filteredItems = navItems.filter(item => 
    item.roles.some(role => roles.includes(role))
  );

  // Group items by role for better organization
  const groupedItems = filteredItems.reduce((acc, item) => {
    const role = item.roles[0];
    if (!acc[role]) acc[role] = [];
    acc[role].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const roleLabels: Record<string, string> = {
    admin: 'Administration',
    warehouse: 'Warehouse',
    vendor: 'Vendor Portal',
    consumer: 'Consumer'
  };

  return (
    <Sidebar className="border-r bg-sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-glow flex-shrink-0 p-1.5">
            <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">NAMMA TRADE</h1>
              <p className="text-xs text-muted-foreground">Procurement Platform</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {Object.entries(groupedItems).map(([role, items]) => (
          <SidebarGroup key={role}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                {roleLabels[role]}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            "hover:bg-sidebar-accent",
                            isActive && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all outline-none",
                "hover:bg-sidebar-accent text-muted-foreground hover:text-foreground justify-between"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>App Settings</span>}
              </div>
              {!collapsed && <ChevronUp className="h-4 w-4" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56" align="start">
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/privacy')}>
              <Shield className="mr-2 h-4 w-4" />
              Privacy Guidelines
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/payment')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/history')}>
              <History className="mr-2 h-4 w-4" />
              Historical Logs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
