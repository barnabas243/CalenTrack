import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';

import {SupabaseClient, createClient} from '@supabase/supabase-js';
import {System} from '../powersync/system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Database} from '@/utils/database.types';

const supabaseURL =
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string) || 'https://qudlldjipyzlpebtzten.supabase.co';
const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGxsZGppcHl6bHBlYnR6dGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODIzMTgsImV4cCI6MjAyOTk1ODMxOH0.ksUphYByklSOjO9JardthUsFsiC9fhXUWDF4tb--iQ4';
const powersyncurl =
  (process.env.EXPO_PUBLIC_POWERSYNC_URL as string) ||
  'https://66bdae5b619fa3cbfad37900.powersync.journeyapps.com';

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception
  // Examples include data type mismatch.
  new RegExp('^22...$'),
  // Class 23 — Integrity Constraint Violation.
  // Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
  new RegExp('^23...$'),
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  new RegExp('^42501$'),
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  client: SupabaseClient<Database>;

  constructor(protected system: System) {
    this.client = createClient(supabaseURL, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  async login(username: string, password: string) {
    const {error} = await this.client.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      throw error;
    }
  }

  async register(username: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const {error} = await this.client.auth.signUp({
      email: username,
      password: password,
    });

    if (error) {
      throw error;
    }
  }

  async loginWithGoogle(idToken: string) {
    const {error} = await this.client.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw error;
    }
  }

  async fetchProfile(id: string) {
    const {data, error} = await this.client.from('profiles').select('*').eq('id', id).single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateProfile(updatedProfile: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    expoPushToken?: string;
  }) {
    // Step 1: Fetch the current data
    const currentProfile = await this.fetchProfile(updatedProfile.id).catch(error => {
      throw error;
    });

    // Step 2: Merge current data with updated fields
    const profileToUpdate = {
      ...currentProfile,
      ...updatedProfile,
      updated_at: new Date().toISOString(), // Use toISOString for ISO 8601 format
    };

    // Step 3: Perform the upsert
    const {error} = await this.client.from('profiles').upsert([profileToUpdate]); // Ensure 'id' is used for conflict resolution

    if (error) {
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from the current password');
    }

    const {error} = await this.client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  }
  async logout() {
    const {error} = await this.client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async fetchCredentials() {
    const {
      data: {session},
      error,
    } = await this.client.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    console.debug('session expires at', session.expires_at);

    return {
      endpoint: powersyncurl,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
      userID: session.user.id,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    console.debug('Uploading data to Supabase');
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table as 'todos' | 'sections' | 'profiles');
        let result: any = null;
        switch (op.op) {
          case UpdateType.PUT:
            // eslint-disable-next-line no-case-declarations
            const record = {...op.opData, id: op.id};
            result = await table.upsert(record);
            break;
          case UpdateType.PATCH:
            result = await table.update(op.opData ?? {}).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result.error) {
          console.error(result.error);
          result.error.message = `Could not ${op.op} data to Supabase error: ${JSON.stringify(result)}`;
          throw result.error;
        }
      }

      await transaction.complete();
    } catch (ex: any) {
      console.debug(ex);
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some(regex => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error('Data upload error - discarding:', lastOp, ex);
        await transaction.complete();
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        throw ex;
      }
    }
  }
}
