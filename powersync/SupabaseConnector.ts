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
import {PROFILE_TABLE} from './AppSchema';

// Supabase and PowerSync configuration
const supabaseURL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qudlldjipyzlpebtzten.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGxsZGppcHl6bHBlYnR6dGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODIzMTgsImV4cCI6MjAyOTk1ODMxOH0.ksUphYByklSOjO9JardthUsFsiC9fhXUWDF4tb--iQ4';
const powersyncURL =
  process.env.EXPO_PUBLIC_POWERSYNC_URL ||
  'https://66bdae5b619fa3cbfad37900.powersync.journeyapps.com';

// Postgres response codes that indicate fatal errors and should not be retried
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception (e.g., data type mismatch)
  new RegExp('^22...$'),
  // Class 23 — Integrity Constraint Violation (e.g., NOT NULL, FOREIGN KEY, UNIQUE violations)
  new RegExp('^23...$'),
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  new RegExp('^42501$'),
];

export interface ConfirmPasswordParams {
  [key: string]: 'confirm_current_user_password';
}

export interface ConfirmPasswordResponse {
  data: boolean;
}

/**
 * Connector class for integrating Supabase with PowerSync.
 * Implements the PowerSyncBackendConnector interface.
 */
export class SupabaseConnector implements PowerSyncBackendConnector {
  client: SupabaseClient<Database>;

  /**
   * Constructor for SupabaseConnector.
   * @param system - The system instance used for integration.
   */
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

  /**
   * Logs in a user with their email and password.
   * @param username - The user's email address.
   * @param password - The user's password.
   * @throws Will throw an error if the login fails.
   */
  async login(username: string, password: string) {
    const {error} = await this.client.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Registers a new user with their email and password.
   * @param username - The user's email address.
   * @param password - The user's password.
   * @param confirmPassword - The confirmation of the user's password.
   * @throws Will throw an error if the passwords do not match or if registration fails.
   */
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

  /**
   * Logs in a user using Google OAuth.
   * @param idToken - The Google ID token.
   * @throws Will throw an error if the login fails.
   */
  async loginWithGoogle(idToken: string) {
    const {error} = await this.client.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Fetches the profile data for a given user ID.
   * @param id - The user ID.
   * @returns The profile data.
   * @throws Will throw an error if the fetch fails.
   */
  async fetchProfile(id: string) {
    const {data, error} = await this.client.from(PROFILE_TABLE).select('*').eq('id', id).single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Updates the profile data for a given user.
   * @param updatedProfile - The updated profile data.
   * @returns The updated profile data.
   * @throws Will throw an error if the update fails.
   */
  async updateProfile(updatedProfile: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    expoPushToken?: string;
  }) {
    // Fetch the current profile data
    const currentProfile = await this.fetchProfile(updatedProfile.id).catch(error => {
      throw error;
    });

    // Merge current data with updated fields
    const profileToUpdate = {
      ...currentProfile,
      ...updatedProfile,
      updated_at: new Date().toISOString(), // ISO 8601 format
    };

    // Perform the upsert operation
    const {data, error} = await this.client.from('profiles').upsert([profileToUpdate]).select();

    if (error) {
      throw error;
    }

    return data[0];
  }

  async checkCurrentPassword(
    current_plain_password: string,
  ): Promise<ConfirmPasswordResponse | Error> {
    const {data, error} = await this.client.rpc('confirm_current_user_password', {
      current_plain_password,
    });

    if (error) {
      console.error('Error:', error.message);
      throw error;
    }

    console.log('Data:', data);

    return data;
  }

  async generateUUID() {
    const {data, error} = await this.client.rpc('gen_random_uuid_rpc');
    if (error) {
      throw error;
    }

    const generatedUUID = data?.toString(); // This will be your new UUID
    console.log('Generated UUID:', generatedUUID);

    if (!generatedUUID) {
      throw new Error('Could not generate UUID');
    }

    return generatedUUID;
  }

  /**
   * Changes the user's password.
   * @param currentPassword - The user's current password.
   * @param newPassword - The user's new password.
   * @throws Will throw an error if the new password is the same as the current password or if the change fails.
   */
  async changePassword(currentPassword: string, newPassword: string) {
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from the current password');
    }

    await this.checkCurrentPassword(currentPassword).catch(error => {
      throw error;
    });

    await this.client.auth
      .updateUser({
        password: newPassword,
      })
      .catch(error => {
        throw error;
      });
  }

  /**
   * Updates the user's email address.
   * @param newEmail - The new email address.
   * @throws Will throw an error if the update fails.
   */
  async updateEmail(newEmail: string) {
    const {error} = await this.client.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Logs out the current user.
   * @throws Will throw an error if the logout fails.
   */
  async logout() {
    const {error} = await this.client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  /**
   * Fetches the Supabase credentials required for PowerSync to perform data sync operations.
   * @returns The Supabase credentials.
   * @throws Will throw an error if the credentials cannot be fetched.
   */
  async fetchCredentials() {
    const {
      data: {session},
      error,
    } = await this.client.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    return {
      endpoint: powersyncURL,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
      userID: session.user.id,
    };
  }

  /**
   * Uploads data from the local database to Supabase.
   * @param database - The local PowerSync database instance.
   * @throws Will throw an error if the upload fails and the error is retryable.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    console.debug('Uploading data to Supabase');
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table as 'todos' | 'sections' | 'profiles');
        let result: any = null;
        switch (op.op) {
          case UpdateType.PUT:
            const record = {...op.opData, id: op.id, parent_id: op.opData?.parent_id || null};
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

      console.debug('Data upload complete');
    } catch (ex: any) {
      console.debug(ex);
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some(regex => regex.test(ex.code))) {
        console.error('Data upload error - discarding:', lastOp, ex);
        await transaction.complete();
      } else {
        throw ex;
      }
    }
  }
}
