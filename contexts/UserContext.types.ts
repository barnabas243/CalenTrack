import {User} from '@supabase/supabase-js';
import {ReactNode} from 'react';

export interface UserContextType {
  user: User | null; // Adjust type as per your user data structure
  fetchUser: () => void;
}
export type UserProviderProps = {
  children: ReactNode;
};
