import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User as UserIcon, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: (profile as any).phone || '',
        address: (profile as any).address || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await (supabase.from('profiles' as any) as any)
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully! Refresh to see changes globally.');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to update profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (formData.full_name) {
      return formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account details and preferences.</p>
        </div>

        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your photo and personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-2xl gradient-primary text-primary-foreground font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 w-full space-y-2">
                  <Label>Profile ID / Email</Label>
                  <Input disabled value={user?.email || 'Unknown'} className="bg-muted cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter your full name" 
                      className="pl-9"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <Label>Phone Number</Label>
                  <Input 
                    type="tel"
                    placeholder="e.g. +91 9876543210" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label>Avatar Photo URL</Label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://example.com/photo.jpg" 
                    className="pl-9"
                    value={formData.avatar_url}
                    onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Paste an external URL to any image you'd like to use as your avatar.</p>
              </div>

              <div className="space-y-2 text-left">
                <Label>Address / Delivery Details</Label>
                <Textarea 
                  placeholder="Enter your full delivery address..."
                  className="min-h-[100px] resize-none"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/20 p-4">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
