// Import necessary polyfills for compatibility
import '@azure/core-asynciterator-polyfill';
import 'react-native-url-polyfill/auto';

import React from 'react';

// Import PowerSync and Kysely related modules
import {PowerSyncDatabase} from '@powersync/react-native';
import {Kysely, wrapPowerSyncWithKysely} from '@powersync/kysely-driver';

// Import custom Supabase connector and schema definitions
import {SupabaseConnector} from './SupabaseConnector';
import {AppSchema, Database} from './AppSchema';

/**
 * System class to manage PowerSync and Supabase connections.
 */
export class System {
  // Instance of SupabaseConnector for connecting to Supabase
  supabaseConnector: SupabaseConnector;

  // Instance of PowerSyncDatabase for handling PowerSync operations
  powersync: PowerSyncDatabase;

  // Kysely instance wrapped around PowerSync for type-safe database operations
  db: Kysely<Database>;

  /**
   * Constructor to initialize PowerSync, SupabaseConnector, and Kysely.
   */
  constructor() {
    // Initialize PowerSync with the provided schema and database filename
    const powersync = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        dbFilename: 'powersync.db',
      },
    });

    // Initialize SupabaseConnector with the current system instance
    this.supabaseConnector = new SupabaseConnector(this);

    // Assign the initialized PowerSync instance
    this.powersync = powersync;

    // Wrap PowerSync with Kysely to create a type-safe database instance
    this.db = wrapPowerSyncWithKysely<Database>(this.powersync);
  }

  /**
   * Initialize and connect PowerSync to Supabase.
   */
  async init() {
    // Initialize PowerSync
    await this.powersync.init();

    // Connect PowerSync to Supabase using the SupabaseConnector
    await this.powersync.connect(this.supabaseConnector);
  }
}

// Create a singleton instance of the System class
export const system = new System();

// Create a React context for providing the system instance to the component tree
export const SystemContext = React.createContext(system);

/**
 * Custom hook to access the system instance from the context.
 * @returns The system instance.
 */
export const useSystem = () => React.useContext(SystemContext);
