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

  const checkSubscription = async (userOverride?: User | null) => {
    const currentUser = userOverride || user;
    console.log('CHECKSUBSCRIPTION START: Function called');
    console.log('CHECKSUBSCRIPTION: User check - exists:', !!currentUser);
    console.log('CHECKSUBSCRIPTION: User email:', currentUser ? currentUser.email : 'NO USER');
    console.log('CHECKSUBSCRIPTION: Using userOverride:', !!userOverride);
    
    if (!currentUser) {
      console.log('CHECKSUBSCRIPTION NO USER: No user found, setting subscription inactive');
      console.log('CHECKSUBSCRIPTION NO USER: About to set isSubscriptionActive to false');
      setIsSubscriptionActive(false);
      console.log('CHECKSUBSCRIPTION NO USER: About to set subscriptionLoading to false');
      setSubscriptionLoading(false);
      console.log('CHECKSUBSCRIPTION NO USER: Function returning early');
      return;
    }

    console.log('CHECKSUBSCRIPTION: User exists, starting subscription check for:', currentUser.email);
    console.log('CHECKSUBSCRIPTION: About to set subscriptionLoading to true');
    setSubscriptionLoading(true);
    console.log('CHECKSUBSCRIPTION: subscriptionLoading set to true');

    console.log('CHECKSUBSCRIPTION: About to enter try block');
    try {
      console.log('CHECKSUBSCRIPTION TRY: Getting session from supabase...');
      const sessionResult = await supabase.auth.getSession();
      console.log('CHECKSUBSCRIPTION TRY: Session result received');
      console.log('CHECKSUBSCRIPTION TRY: Session exists:', !!sessionResult.data.session);
      console.log('CHECKSUBSCRIPTION TRY: Session user:', sessionResult.data.session?.user?.email || 'NO USER IN SESSION');
      console.log('CHECKSUBSCRIPTION TRY: Access token exists:', !!sessionResult.data.session?.access_token);
      
      console.log('CHECKSUBSCRIPTION TRY: About to make fetch request...');
      console.log('CHECKSUBSCRIPTION TRY: URL:', `${SUPABASE_FUNCTIONS_URL}/check-subscription`);
      console.log('CHECKSUBSCRIPTION TRY: Auth header:', `Bearer ${sessionResult.data.session?.access_token ? 'TOKEN_EXISTS' : 'NO_TOKEN'}`);
      
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionResult.data.session?.access_token ?? ''}`,
        },
      });

      console.log('CHECKSUBSCRIPTION TRY: Fetch completed');
      console.log('CHECKSUBSCRIPTION TRY: Response status:', res.status);
      console.log('CHECKSUBSCRIPTION TRY: Response ok:', res.ok);
      console.log('CHECKSUBSCRIPTION TRY: Response headers:', [...res.headers.entries()]);

      console.log('CHECKSUBSCRIPTION TRY: About to check if response is ok...');
      if (res.ok) {
        console.log('CHECKSUBSCRIPTION SUCCESS: Response is ok, about to parse JSON...');
        const responseData = await res.json();
        console.log('CHECKSUBSCRIPTION SUCCESS: JSON parsed successfully');
        console.log('CHECKSUBSCRIPTION SUCCESS: Response data:', JSON.stringify(responseData, null, 2));
        console.log('CHECKSUBSCRIPTION SUCCESS: isActive value:', responseData.isActive);
        console.log('CHECKSUBSCRIPTION SUCCESS: About to set state - current isSubscriptionActive before update:', isSubscriptionActive);
        console.log('CHECKSUBSCRIPTION SUCCESS: Calling setIsSubscriptionActive with:', responseData.isActive);
        setIsSubscriptionActive(responseData.isActive);
        console.log('CHECKSUBSCRIPTION SUCCESS: setIsSubscriptionActive called');
      } else {
        console.log('CHECKSUBSCRIPTION ERROR: Response not ok, status:', res.status);
        console.log('CHECKSUBSCRIPTION ERROR: About to read error text...');
        const errorText = await res.text().catch(() => 'Could not read error');
        console.log('CHECKSUBSCRIPTION ERROR: Error response text:', errorText);
        console.log('CHECKSUBSCRIPTION ERROR: Setting isSubscriptionActive to false');
        setIsSubscriptionActive(false);
        console.log('CHECKSUBSCRIPTION ERROR: setIsSubscriptionActive(false) called');
      }
      console.log('CHECKSUBSCRIPTION TRY: End of try block reached');
    } catch (error) {
      console.log('CHECKSUBSCRIPTION CATCH: Exception occurred:', error);
      console.log('CHECKSUBSCRIPTION CATCH: Error type:', typeof error);
      console.log('CHECKSUBSCRIPTION CATCH: Error message:', error?.message);
      console.log('CHECKSUBSCRIPTION CATCH: Full error:', JSON.stringify(error, null, 2));
      console.log('CHECKSUBSCRIPTION CATCH: Setting isSubscriptionActive to false');
      setIsSubscriptionActive(false);
      console.log('CHECKSUBSCRIPTION CATCH: setIsSubscriptionActive(false) called');
    } finally {
      console.log('CHECKSUBSCRIPTION FINALLY: Finally block executing');
      console.log('CHECKSUBSCRIPTION FINALLY: Setting subscriptionLoading to false');
      setSubscriptionLoading(false);
      console.log('CHECKSUBSCRIPTION FINALLY: subscriptionLoading set to false');
      
      // Log state after React has had a chance to update
      setTimeout(() => {
        console.log('CHECKSUBSCRIPTION FINAL STATE (after timeout):', {
          isSubscriptionActive,
          subscriptionLoading: false,
          user: currentUser?.email
        });
      }, 100);
      console.log('CHECKSUBSCRIPTION FINALLY: Timeout set for final state logging');
    }
    console.log('CHECKSUBSCRIPTION END: Function completely finished');
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
        fetchProfile(session.user.id, session.user);
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
          fetchProfile(session.user.id, session.user);
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

  const fetchProfile = async (userId: string, sessionUser?: User | null) => {
    console.log('FETCHPROFILE START: Called with userId:', userId);
    console.log('FETCHPROFILE: About to enter try block');
    try {
      console.log('FETCHPROFILE: Inside try block, about to query profiles table');
      console.log('FETCHPROFILE: Creating supabase query...');
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      console.log('FETCHPROFILE: Query object created, about to execute...');
      
      const { data, error } = await query;
      console.log('FETCHPROFILE: Query executed, checking results...');
      console.log('FETCHPROFILE: Raw query result - data exists:', !!data);
      console.log('FETCHPROFILE: Raw query result - error exists:', !!error);
      console.log('FETCHPROFILE: Raw query result - error details:', error);
      console.log('FETCHPROFILE: Raw query result - data:', data);

      console.log('FETCHPROFILE: About to check if error exists...');
      if (error) {
        console.log('FETCHPROFILE ERROR DETECTED: Database error:', error);
        console.log('FETCHPROFILE ERROR: About to throw error...');
        throw error;
      }
      console.log('FETCHPROFILE: No error detected, continuing...');
      
      console.log('FETCHPROFILE: Profile data received - exists:', data ? 'YES' : 'NO');
      console.log('FETCHPROFILE: Profile email:', data?.email);
      console.log('FETCHPROFILE: Profile stripe_customer_id:', data?.stripe_customer_id || 'NONE');
      console.log('FETCHPROFILE: Full profile data object:', JSON.stringify(data, null, 2));
      
      console.log('FETCHPROFILE: About to check deleted_at...');
      // Check if the account has been deleted
      if (data.deleted_at) {
        console.log('FETCHPROFILE DELETED: Account has been deleted, signing out user');
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setLoading(false);
        return;
      }
      console.log('FETCHPROFILE: Account not deleted, continuing...');
      
      console.log('FETCHPROFILE: About to set profile state...');
      setProfile(data);
      console.log('FETCHPROFILE: Profile state set successfully');
      console.log('FETCHPROFILE: About to call checkSubscription...');
      
      // Check subscription status after profile is loaded
      console.log('FETCHPROFILE: CALLING CHECKSUBSCRIPTION NOW...');
      console.log('FETCHPROFILE: Passing sessionUser to checkSubscription:', sessionUser?.email || 'NO SESSION USER');
      await checkSubscription(sessionUser || user);
      console.log('FETCHPROFILE: checkSubscription call completed successfully');
      
      console.log('FETCHPROFILE: About to set loading states...');
      setLoading(true);
      console.log('FETCHPROFILE: Set loading to true, about to set timeout...');
      setTimeout(() => {
        console.log('FETCHPROFILE TIMEOUT: Setting final loading to false');
        setLoading(false);
      }, 10);
      console.log('FETCHPROFILE: Timeout set, function should complete normally');
      
    } catch (error) {
      console.log('FETCHPROFILE CATCH: Exception occurred:', error);
      console.log('FETCHPROFILE CATCH: Error type:', typeof error);
      console.log('FETCHPROFILE CATCH: Error message:', error?.message);
      console.log('FETCHPROFILE CATCH: Full error object:', JSON.stringify(error, null, 2));
      console.error('FETCHPROFILE CATCH: Console.error for error:', error);
    } finally {
      console.log('FETCHPROFILE FINALLY: Finally block executing');
      console.log('FETCHPROFILE FINALLY: About to set loading to false');
      setLoading(false);
      console.log('FETCHPROFILE FINALLY: Loading set to false');
    }
    console.log('FETCHPROFILE END: Function completely finished');
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