'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  cartCount: number;
  wishlistCount: number;
  refreshCounts: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  cartCount: 0,
  wishlistCount: 0,
  refreshCounts: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const supabase = createClient();

  const isAdmin = profile?.role === 'admin' ||
    (user?.user_metadata?.role === 'admin') ||
    (user?.app_metadata?.role === 'admin');

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data as UserProfile);
    } catch {
      // Profile may not exist yet
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    try {
      const [cartRes, wishRes] = await Promise.all([
        supabase.from('cart_items').select('quantity').eq('user_id', user.id),
        supabase.from('wishlist_items').select('id').eq('user_id', user.id),
      ]);
      const totalCart = (cartRes.data ?? []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
      setCartCount(totalCart);
      setWishlistCount(wishRes.data?.length ?? 0);
    } catch {
      // Silently fail
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setCartCount(0);
        setWishlistCount(0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) refreshCounts();
  }, [user, refreshCounts]);

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error as Error | null };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, isAdmin,
      cartCount, wishlistCount, refreshCounts,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
