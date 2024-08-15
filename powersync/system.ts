import '@azure/core-asynciterator-polyfill';
import 'react-native-url-polyfill/auto';

import React from 'react';
import {PowerSyncDatabase} from '@powersync/react-native';
import {Kysely, wrapPowerSyncWithKysely} from '@powersync/kysely-driver';
import {SupabaseConnector} from './SupabaseConnector';
import {AppSchema, Database} from './AppSchema';

export class System {
  supabaseConnector: SupabaseConnector;
  powersync: PowerSyncDatabase;
  db: Kysely<Database>;

  constructor() {
    const powersync = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        dbFilename: 'powersync.db',
      },
    });
    this.supabaseConnector = new SupabaseConnector(this);
    this.powersync = powersync;
    this.db = wrapPowerSyncWithKysely<Database>(this.powersync);
  }

  async init() {
    await this.powersync.init();
    await this.powersync.connect(this.supabaseConnector);
  }
}
export const system = new System();

export const SystemContext = React.createContext(system);
export const useSystem = () => React.useContext(SystemContext);
