import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthUser extends User {
  roles?: string[];
}

interface SignInResult {
  data?: { user: User | null; session: Session | null };
  error: AuthError | null;
}

interface SignUpResult {
  data?: { user: User | null; session: Session | null };
  error: AuthError | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  // Fetch user roles from the user_roles table
  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return (data || []).map((r: { role: string }) => r.role);
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (currentSession?.user) {
          const userRoles = await fetchRoles(currentSession.user.id);
          if (!mounted) return;

          const authUser: AuthUser = { ...currentSession.user, roles: userRoles };
          setUser(authUser);
          setSession(currentSession);
          setRoles(userRoles);
        } else {
          setUser(null);
          setSession(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (newSession?.user) {
          const userRoles = await fetchRoles(newSession.user.id);
          if (!mounted) return;

          const authUser: AuthUser = { ...newSession.user, roles: userRoles };
          setUser(authUser);
          setSession(newSession);
          setRoles(userRoles);
        } else {
          setUser(null);
          setSession(null);
          setRoles([]);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, nome?: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, full_name: nome },
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return roles.includes(role) || roles.includes('ADMIN');
  }, [roles]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    roles,
    signIn,
    signUp,
    signOut,
    hasRole,
  };
}
