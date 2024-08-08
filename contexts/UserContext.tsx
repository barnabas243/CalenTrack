import React, {createContext, useEffect, useState} from 'react';
import {supabase} from '@/utils/supabase'; // Adjust path as per your project structure
import {UserContextType, UserProviderProps} from './UserContext.types';
import {Session, User} from '@supabase/supabase-js';
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
let count = 0;
export const AuthProvider = ({children}: UserProviderProps) => {
  console.log('UserProvider rendered ', ++count);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('UserProvider mounted');
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const {data, error} = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) router.replace('/(auth)');
      } catch (error: any) {
        if (error instanceof AuthError) {
          console.error('Authentication Error:', error.message);
        } else {
          console.error('Unexpected Error:', error);
        }
        // Redirect to login on error to handle potential issues
        router.replace('/(auth)');
      } finally {
        setIsLoading(false); // Ensure loading state is always set to false
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const {data: authListener} = supabase.auth.onAuthStateChange((event, newSession) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
          if (!session) setSession(newSession ?? null);
          setUser(newSession?.user ?? null);
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
          break;
        case 'SIGNED_OUT':
          setTimeout(() => {
            router.replace('/(auth)');
          }, 100);
          break;
        case 'PASSWORD_RECOVERY':
          // Handle password recovery event
          break;
        case 'TOKEN_REFRESHED':
          // Handle token refreshed event
          break;
        case 'USER_UPDATED':
          // Handle user updated event
          setUser(newSession?.user ?? null);
          break;
        default:
          break;
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    };
  }, [session]);

  return (
    <UserContext.Provider value={{user, session, setSession, isLoading}}>
      {children}
    </UserContext.Provider>
  );
};
