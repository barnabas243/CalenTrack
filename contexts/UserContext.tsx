import React, {createContext, useEffect, useMemo, useState} from 'react';
import {UserContextType, UserProviderProps} from './UserContext.types';
import {Session} from '@supabase/supabase-js';
import {router} from 'expo-router';
import {useSystem} from '@/powersync/system';

/**
 * Context to hold user-related state
 * @property {object | null} user - The authenticated user object
 * @property {Session | null} session - The current session object
 * @property {function} setSession - Function to set the current session
 * @property {boolean} isLoading - Indicates if the authentication state is still loading
 */
export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  setSession: () => {},
  isLoading: true,
});

/**
 * Context provider component for managing authentication state
 * @param {UserProviderProps} props - Props containing the children components
 */
export const AuthProvider = ({children}: UserProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const system = useSystem();
  const {supabaseConnector} = system;

  // Initialize the system on component mount
  useEffect(() => {
    console.log('Initializing system');
    system.init();
  }, [system]);

  // Auth state change listener
  useEffect(() => {
    const {data: authListener} = supabaseConnector.client.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'INITIAL_SESSION') {
          console.log(event);
          if (newSession && !session) setSession(newSession);

          setIsLoading(false);
          setTimeout(() => {
            router.replace(newSession ? '/(tabs)' : '/(auth)');
          }, 1000);
        } else if (event === 'SIGNED_IN') {
          setSession(newSession);
          if (session) router.replace('/(tabs)');
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setIsLoading(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          router.push('/recover');
          const newPassword = prompt('What would you like your new password to be?') ?? 'password';
          const {data, error} = await supabaseConnector.client.auth.updateUser({
            password: newPassword,
          });

          if (data) alert('Password updated successfully!');
          if (error) alert('There was an error updating your password.');

          setIsLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    };
  }, [session, supabaseConnector.client.auth]);

  // Derive user from session
  const user = useMemo(() => session?.user ?? null, [session]);

  return (
    <UserContext.Provider value={{user, session, setSession, isLoading}}>
      {children}
    </UserContext.Provider>
  );
};
