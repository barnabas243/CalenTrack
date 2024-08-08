import React from 'react';
import {UserContext} from '@/contexts/UserContext';
// Custom hook to consume the UserContext
export const useAuth = () => React.useContext(UserContext);
