import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, UserPlus, Filter, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserViewData {
  id: string;
  name: string;
  email: string;
  role: string;
  joined: string;
  status: string; // we'll default this to active for now
}

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  warehouse: 'bg-secondary/10 text-secondary border-secondary/20',
  vendor: 'bg-accent/10 text-accent border-accent/20',
  consumer: 'bg-muted text-muted-foreground border-border'
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'consumer' });

  const [stats, setStats] = useState({
    admin: 0,
    warehouse: 0,
    vendor: 0,
    consumer: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch directly from profiles and user_roles to guarantee it works even if view isn't created
    const { data: profilesData, error: profileErr } = await (supabase.from('profiles' as any) as any)
      .select('user_id, full_name, email, created_at');
      
    const { data: rolesData } = await (supabase.from('user_roles' as any) as any)
      .select('user_id, role');

    if (profileErr) {
      toast.error("Failed to fetch profiles: " + profileErr.message);
    } else if (profilesData) {
      const roleMap: Record<string, string> = {};
      if (rolesData) {
        rolesData.forEach((r: any) => roleMap[r.user_id] = r.role);
      }

      const mapped = profilesData.map((p: any) => ({
        id: p.user_id,
        name: p.full_name || 'System User',
        email: p.email || 'No email attached',
        role: roleMap[p.user_id] || 'consumer',
        joined: p.created_at || new Date().toISOString(),
        status: 'active'
      }));

      // Sort by newest
      mapped.sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());
      
      setUsers(mapped);

      const counts = { admin: 0, warehouse: 0, vendor: 0, consumer: 0 };
      mapped.forEach((u: any) => {
        if (counts[u.role as keyof typeof counts] !== undefined) {
          counts[u.role as keyof typeof counts]++;
        } else {
          counts.consumer++;
        }
      });
      setStats(counts);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const toastId = toast.loading('Updating role...');
    try {
      // Because a user theoretically can have multiple roles in the DB schema,
      // in this platform we enforce 1 main role per user UI.
      // So we delete old roles and insert the new one.
      await (supabase.from('user_roles' as any) as any).delete().eq('user_id', userId);
      const { error } = await (supabase.from('user_roles' as any) as any).insert({
        user_id: userId,
        role: newRole
      });

      if (error) throw error;
      
      toast.success('Role updated successfully', { id: toastId });
      fetchUsers(); // Refresh the list
    } catch (e: any) {
      toast.error('Failed to change role: ' + e.message, { id: toastId });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a fully robust scenario, creating an auth user requires a backend Edge Function.
    // For this prototype, we simulate creation by directly inserting the profile.
    // When the user authenticates later with this email using Google or Magic Link, it pairs up seamlessly.
    const tempUuid = crypto.randomUUID();
    
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: tempUuid,
      email: newUser.email,
      full_name: newUser.name,
      phone: newUser.phone,
    });

    if (profileError) {
      toast.error('Failed to create profile: ' + profileError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: roleError } = await (supabase.from('user_roles' as any) as any).insert({
      user_id: tempUuid,
      role: newUser.role
    });

    if (roleError) {
      toast.error('Failed to assign role: ' + roleError.message);
    } else {
      toast.success('User inserted successfully!');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', role: 'consumer' });
      fetchUsers();
    }
    
    setIsSubmitting(false);
  };

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage all platform users and re-assign roles
            </p>
          </div>
          <Button className="gradient-primary" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {showAddUser ? 'Cancel' : 'Add User'}
          </Button>
        </div>

        {showAddUser && (
          <Card className="border-primary/50 shadow-md animate-fade-in">
            <CardHeader>
              <CardTitle>Register New User</CardTitle>
              <CardDescription>Manually insert a user profile record into the verified pool.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input required placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input required type="email" placeholder="john@example.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input placeholder="+91 9876543210" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Role</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="consumer">Consumer (Default)</option>
                    <option value="vendor">Vendor</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save User Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.admin}</div>
              <p className="text-xs text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.warehouse}</div>
              <p className="text-xs text-muted-foreground">Warehouse Staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.vendor}</div>
              <p className="text-xs text-muted-foreground">Vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.consumer}</div>
              <p className="text-xs text-muted-foreground">Consumers</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Verified Users</CardTitle>
                <CardDescription>A live feed of all accounts registered securely in the platform</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Secure Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || 'Unnamed User'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role] || roleColors['consumer']}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Consumer'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono tracking-tighter">
                      {new Date(user.joined).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="group-hover:bg-muted/50 transition-colors border">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {['admin', 'warehouse', 'vendor', 'consumer'].map(roleOption => (
                                  <DropdownMenuItem 
                                    key={roleOption}
                                    disabled={user.role === roleOption}
                                    onClick={() => handleRoleChange(user.id, roleOption)}
                                  >
                                    Set to {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-destructive">
                            Delete User (Admin CLI Only)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
