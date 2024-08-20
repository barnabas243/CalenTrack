import React, {ReactNode, useMemo} from 'react';
import {useSystem} from './system';
import {PowerSyncContext} from '@powersync/react-native';

export const PowerSyncProvider = ({children}: {children: ReactNode}) => {
  const {powersync} = useSystem();

  const db = useMemo(() => powersync, [powersync]);

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
};
