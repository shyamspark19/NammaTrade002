import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Target, ShieldAlert, Loader2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function HistoricalLogs() {
  const { user, roles } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (user?.id) fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Due to strict Backend RLS:
      // - If admin, this query magically returns EVERYTHING globally.
      // - If standard user, this query natively strips it down to ONLY their own logs.
      const { data, error } = await (supabase.from('activity_logs' as any) as any)
        .select(`
          id,
          action,
          details,
          created_at,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
      
    } catch (e: any) {
      console.error(e);
      // Suppress missing table errors if they haven't run the SQL script yet
      if (e.code === '42P01') {
        toast.error('Log database missing. Please run the setup_logs.sql script.');
      } else {
        toast.error('Failed to load activity logs: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Historical Logs</h1>
            <p className="text-muted-foreground mt-1">
              Secure auditing traces of actions taken on the platform.
            </p>
          </div>
          {isAdmin && (
            <Badge variant="destructive" className="gap-1 px-3 py-1">
              <ShieldAlert className="h-4 w-4" />
              GLOBAL ADMIN CLEARANCE
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : logs.length === 0 ? (
             <div className="text-center py-16 bg-muted/20 border border-dashed rounded-lg">
                <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No tracking logs found.</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                   This auditing portal tracks actions natively. As you complete actions across the site, they will propagate here securely.
                </p>
             </div>
          ) : (
             <div className="relative border-l-2 border-muted ml-4 space-y-6 pb-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative pl-6 sm:pl-8 group">
                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary/40 group-hover:bg-primary transition-colors flex items-center justify-center">
                       <Target className="h-2 w-2 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex max-sm:flex-col justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors uppercase text-[10px] tracking-wider font-bold">
                                {log.action}
                              </Badge>
                              {isAdmin && (
                                <span className="text-xs font-semibold text-muted-foreground truncate">
                                  User: {log.profiles?.full_name || log.profiles?.email || 'Unknown'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{log.details}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-md">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
