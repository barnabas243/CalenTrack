import React, {createContext, useEffect, useMemo, useState} from 'react';
import {UserContextType, UserProviderProps} from './UserContext.types';
import {Session} from '@supabase/supabase-js';
import {router} from 'expo-router';
import {useSystem} from '@/powersync/system';

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

  const system = useSystem();
  const {supabaseConnector} = system;

  React.useEffect(() => {
    console.log('Initializing system');
    system.init();
  }, [system]);

  // Auth state change listener
  useEffect(() => {
    const {data: authListener} = supabaseConnector.client.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          console.log(event);
          if (!session) setSession(newSession);
          setIsLoading(false);

          if (session) router.replace('/(tabs)');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/(auth)');
          setIsLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    };
  }, [session, supabaseConnector.client.auth]); // Empty dependency array

  // Derive user from session
  const user = useMemo(() => session?.user ?? null, [session]);

  return (
    <UserContext.Provider value={{user, session, setSession, isLoading}}>
      {children}
    </UserContext.Provider>
  );
};
