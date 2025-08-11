import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, SUPABASE_FUNCTIONS_URL } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isSubscriptionActive: boolean;
  subscriptionLoading: boolean;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Simplified subscription check - no complex logging
  const checkSubscription = async (userToCheck: User) => {
    setSubscriptionLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubscriptionActive(data.isActive);
      } else {
        setIsSubscriptionActive(false);
      }
    } catch (error) {
      console.error('Subscription check failed:', error);
      setIsSubscriptionActive(false);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await checkSubscription(user);
    }
  };

  // Combined function to handle user authentication and profile/subscription loading
  const handleUserAuth = async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setIsSubscriptionActive(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profileData) {
        throw new Error('Failed to fetch profile');
      }

      // Check if account is deleted
      if (profileData.deleted_at) {
        await supabase.auth.signOut();
        return;
      }

      setProfile(profileData);

      // Check subscription
      await checkSubscription(user);
      
    } catch (error) {
      console.error('Error in handleUserAuth:', error);
      setProfile(null);
      setIsSubscriptionActive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      handleUserAuth(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        handleUserAuth(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw error;
    return data;
  };

  const signOut = async () => {
    console.log('🔴 signOut: Function called');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('🔴 signOut: Error occurred:', error);
      console.error('Error signing out:', error);
    } else {
      console.log('🔴 signOut: Successfully signed out');
    }
  };

  const value = {
    user,
    profile,
    loading,
    isSubscriptionActive,
    subscriptionLoading,
    signOut,
    fetchProfile,
    setProfile,
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 