import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'warehouse' | 'vendor' | 'consumer';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, role?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer fetching to avoid blocking auth state
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch roles using RPC
    const { data: rolesData } = await supabase
      .rpc('get_user_roles', { _user_id: userId });
    
    if (rolesData) {
      setRoles(rolesData as AppRole[]);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName?: string, role?: string) {
    // 🚀 DEMO BYPASS: If you hit Supabase rate limits, use "demo" in your email to skip authentication.
    if (email.toLowerCase().includes('demo')) {
      const mockUser = { id: 'demo-123', email } as User;
      setUser(mockUser);
      setSession({ user: mockUser, access_token: 'demo-token', refresh_token: '', expires_in: 9999, expires_at: 9999, token_type: 'bearer' } as Session);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role: role }
      }
    });

    // Auto-fallback for local development 
    if (error && (error.message.includes('rate limit') || error.message.includes('already registered'))) {
      const signInAttempt = await supabase.auth.signInWithPassword({ email, password });
      if (!signInAttempt.error) {
        return { error: null };
      }
    }

    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function hasRole(role: AppRole) {
    return roles.includes(role);
  }

  async function refreshRoles() {
    if (!user) return;
    const { data: rolesData } = await supabase
      .rpc('get_user_roles', { _user_id: user.id });
    if (rolesData) {
      setRoles(rolesData as AppRole[]);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole,
      refreshRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
