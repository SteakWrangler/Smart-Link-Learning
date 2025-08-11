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
  console.log('🟡 AuthProvider: Component initializing');
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  console.log('🟡 AuthProvider: Initial state set - loading:', true, 'isSubscriptionActive:', false);

  const checkSubscription = async () => {
    console.log('🔵 checkSubscription: Function called, user:', user ? user.email : 'null');
    
    if (!user) {
      console.log('🔴 checkSubscription: No user, setting subscription inactive');
      setIsSubscriptionActive(false);
      setSubscriptionLoading(false);
      return;
    }

    console.log('🔵 checkSubscription: Starting subscription check for user:', user.email);
    setSubscriptionLoading(true);
    console.log('🔵 checkSubscription: Set subscriptionLoading to true');

    try {
      console.log('🔵 checkSubscription: Getting session...');
      const { data: sessionRes } = await supabase.auth.getSession();
      console.log('🔵 checkSubscription: Session data:', sessionRes.session ? 'exists' : 'null');
      
      console.log('🔵 checkSubscription: Making request to check-subscription function...');
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionRes.session?.access_token ?? ''}`,
        },
      });

      console.log('🔵 checkSubscription: Response status:', res.status);

      if (res.ok) {
        const responseData = await res.json();
        console.log('SUBSCRIPTION CHECK SUCCESS! Response data:', JSON.stringify(responseData, null, 2));
        console.log('SUBSCRIPTION CHECK: Setting isSubscriptionActive to:', responseData.isActive);
        console.log('SUBSCRIPTION CHECK: About to set state - current isSubscriptionActive before update:', isSubscriptionActive);
        setIsSubscriptionActive(responseData.isActive);
        console.log('SUBSCRIPTION CHECK: State setter called with value:', responseData.isActive);
      } else {
        console.log('SUBSCRIPTION CHECK FAILED with status:', res.status);
        const errorText = await res.text().catch(() => 'Could not read error');
        console.log('SUBSCRIPTION CHECK ERROR response:', errorText);
        console.log('SUBSCRIPTION CHECK: Setting isSubscriptionActive to false due to error');
        setIsSubscriptionActive(false);
      }
    } catch (error) {
      console.log('🔴 checkSubscription: Exception occurred:', error);
      setIsSubscriptionActive(false);
    } finally {
      console.log('SUBSCRIPTION CHECK: Setting subscriptionLoading to false');
      setSubscriptionLoading(false);
      
      // Log state after React has had a chance to update
      setTimeout(() => {
        console.log('SUBSCRIPTION CHECK FINAL STATE (after update):', {
          isSubscriptionActive,
          subscriptionLoading: false,
          user: user?.email
        });
      }, 100);
    }
  };

  const refreshSubscription = async () => {
    console.log('🔵 refreshSubscription: Function called');
    await checkSubscription();
    console.log('🔵 refreshSubscription: Function completed');
  };

  useEffect(() => {
    console.log('🟡 AuthProvider: useEffect (auth setup) starting');
    
    // Get initial session
    console.log('🟡 AuthProvider: Getting initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🟡 AuthProvider: Initial session result:', session ? `User: ${session.user?.email}` : 'No session');
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🟡 AuthProvider: Initial session has user, calling fetchProfile');
        fetchProfile(session.user.id);
      } else {
        console.log('🟡 AuthProvider: No initial session, setting loading to false');
        setLoading(false);
      }
    });

    // Listen for auth changes
    console.log('🟡 AuthProvider: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🟢 AUTH STATE CHANGE:', event, session?.user?.email || 'no user');
        console.log('🟢 AUTH STATE CHANGE: Full event details:', { event, hasUser: !!session?.user, userEmail: session?.user?.email });
        
        setUser(session?.user ?? null);
        console.log('🟢 AUTH STATE CHANGE: Set user state to:', session?.user?.email || 'null');
        
        if (session?.user) {
          console.log('🟢 AUTH STATE CHANGE: User exists, calling fetchProfile with ID:', session.user.id);
          fetchProfile(session.user.id);
        } else {
          console.log('🟢 AUTH STATE CHANGE: No user, clearing all data');
          setProfile(null);
          setIsSubscriptionActive(false);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🟡 AuthProvider: Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('🟠 fetchProfile: Called with userId:', userId);
    try {
      console.log('🟠 fetchProfile: Querying profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('🔴 fetchProfile: Database error:', error);
        throw error;
      }
      
      console.log('🟠 fetchProfile: Profile data received:', data ? 'exists' : 'null');
      console.log('🟠 fetchProfile: Profile email:', data?.email);
      console.log('🟠 fetchProfile: Profile stripe_customer_id:', data?.stripe_customer_id || 'none');
      
      // Check if the account has been deleted
      if (data.deleted_at) {
        console.log('🔴 fetchProfile: Account has been deleted, signing out user');
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Immediately update the profile state
      console.log('🟠 fetchProfile: Setting profile state');
      setProfile(data);
      console.log('🟠 fetchProfile: Profile state set, now calling checkSubscription');
      
      // Check subscription status after profile is loaded
      await checkSubscription();
      console.log('🟠 fetchProfile: checkSubscription completed');
      
      // Force a re-render by briefly setting loading to true
      console.log('🟠 fetchProfile: Setting loading states');
      setLoading(true);
      setTimeout(() => {
        console.log('🟠 fetchProfile: Setting final loading to false');
        setLoading(false);
      }, 10);
      
    } catch (error) {
      console.log('🔴 fetchProfile: Exception occurred:', error);
      console.error('Error fetching profile:', error);
    } finally {
      console.log('🟠 fetchProfile: Finally block, setting loading to false');
      setLoading(false);
    }
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