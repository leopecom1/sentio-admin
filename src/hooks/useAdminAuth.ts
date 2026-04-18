import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminAuthState {
  isAdmin: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    user: null,
    loading: true,
    error: null,
  });

  // Check current session and admin status
  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          if (!cancelled) {
            setState({ isAdmin: false, user: null, loading: false, error: null });
          }
          return;
        }

        // Check if this user has is_admin = true in profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (!cancelled) {
          setState({
            isAdmin: profile?.is_admin === true,
            user: session.user,
            loading: false,
            error: profile?.is_admin !== true
              ? 'Tu cuenta no tiene permisos de administrador.'
              : null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            isAdmin: false,
            user: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Error al verificar permisos.',
          });
        }
      }
    }

    checkAdmin();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ isAdmin: false, user: null, loading: false, error: null });
      } else {
        // Re-check admin status when auth changes
        checkAdmin();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) {
        throw new Error('No se pudo iniciar sesion.');
      }

      // Verify admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.is_admin !== true) {
        // Sign out non-admin users immediately
        await supabase.auth.signOut();
        setState({
          isAdmin: false,
          user: null,
          loading: false,
          error: 'Tu cuenta no tiene permisos de administrador.',
        });
        return;
      }

      setState({
        isAdmin: true,
        user: data.user,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        isAdmin: false,
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al iniciar sesion.',
      });
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ isAdmin: false, user: null, loading: false, error: null });
  }, []);

  return {
    isAdmin: state.isAdmin,
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  };
}
