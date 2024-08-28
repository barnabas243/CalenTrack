import {ActivityLog} from '@/powersync/AppSchema';

// Define the initial state for the activity log slice
export interface ActivityLogState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
}
