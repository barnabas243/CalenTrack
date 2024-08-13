import React, {createContext, useEffect, useMemo, useState} from 'react';
import {supabase} from '@/utils/supabase'; // Adjust path as per your project structure
import {UserContextType, UserProviderProps} from './UserContext.types';
import {Session} from '@supabase/supabase-js';
import {AuthError} from '@supabase/supabase-js';
import {router} from 'expo-router';

// Create a context to hold user-related state
export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  setSession: () => {},
  isLoading: true,
});

// Context provider component
export const AuthProvider = ({children}: UserProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user on mount
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const {data, error} = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          router.replace('/(auth)');
        } else {
          setSession(data.session);
        }
      } catch (error: any) {
        if (error instanceof AuthError) {
          console.error('Authentication Error:', error.message);
        } else {
          console.error('Unexpected Error:', error);
        }
        router.replace('/(auth)');
      } finally {
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    initializeUser();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const {data: authListener} = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (!session) setSession(newSession);
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)');
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    };
  }, [session]); // Empty dependency array

  // Derive user from session
  const user = useMemo(() => session?.user ?? null, [session]);

  return (
    <UserContext.Provider value={{user, session, setSession, isLoading}}>
      {children}
    </UserContext.Provider>
  );
};
