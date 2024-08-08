import {Session, User} from '@supabase/supabase-js';
import {ReactNode} from 'react';

/**
 * Defines the shape of the user context in the application.
 * - `user`: The currently authenticated user, or `null` if no user is authenticated.
 * - `session`: The current session object, or `null` if there is no active session.
 * - `setSession`: Function to update the session state.
 * - `isLoading`: Boolean indicating whether the authentication state is currently being loaded.
 *
 */
export interface UserContextType {
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  isLoading: boolean;
}

/**
 * Defines the props expected by the `UserProvider` component.
 * - `children`: React node(s) to be rendered within the context provider.
 */
export type UserProviderProps = {
  children: ReactNode;
};
