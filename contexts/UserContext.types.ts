import {Session, User} from '@supabase/supabase-js';
import {ReactNode} from 'react';

export interface UserContextType {
  user: User | null; // Adjust type as per your user data structure
  session: Session | null;
  setSession: (session: Session | null) => void;
  isLoading: boolean;
}
export type UserProviderProps = {
  children: ReactNode;
};
