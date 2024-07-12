import React, {createContext, useContext, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {supabase} from '@/utils/supabase'; // Adjust path as per your project structure
import {UserContextType, UserProviderProps} from './UserContext.types';
import {User} from '@supabase/supabase-js';
import {AuthError} from '@supabase/supabase-js';
import {router} from 'expo-router';

// Create a context to hold user-related state

const UserContext = createContext<UserContextType>({
  user: null,
  fetchUser: () => {},
});
// Custom hook to consume the UserContext
export const useUser = () => useContext(UserContext);

// Context provider component
export const UserProvider = ({children}: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null); // Supabase User type

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const {
        data: {user},
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;

      if (user) setUser(user);
      else Alert.alert('User not found');
    } catch (error: any) {
      if (error instanceof AuthError) {
        // General error handling
        Alert.alert('Error Accessing User. You are not authenticated.');
        console.error('Error accessing user:', error.message);
        router.push('/login');
      } else {
        // Handle other specific errors
        Alert.alert('Unexpected error. Please try again.');
        console.error('Unexpected error:', error);
        // Perform actions for other specific errors
      }
    }
  };

  return <UserContext.Provider value={{user, fetchUser}}>{children}</UserContext.Provider>;
};
