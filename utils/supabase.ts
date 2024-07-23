import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {Database} from './database.types';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qudlldjipyzlpebtzten.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGxsZGppcHl6bHBlYnR6dGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODIzMTgsImV4cCI6MjAyOTk1ODMxOH0.ksUphYByklSOjO9JardthUsFsiC9fhXUWDF4tb--iQ4',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
