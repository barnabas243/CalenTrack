import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {ACTIVITY_LOG_TABLE, ActivityLog} from '@/powersync/AppSchema'; // Adjust path to your types
import {Kysely} from 'kysely'; // Adjust import based on your setup
import {ActivityLogState} from './types';

export const initialState: ActivityLogState = {
  logs: [],
  loading: false,
  error: null,
};

// Define the Thunks for async actions

// Fetch activity logs
export const fetchActivityLogs = createAsyncThunk<
  ActivityLog[],
  {db: Kysely<any>},
  {rejectValue: string}
>('activityLogs/fetchActivityLogs', async ({db}, {rejectWithValue}) => {
  try {
    const logs = await db
      .selectFrom(ACTIVITY_LOG_TABLE)
      .selectAll()
      .orderBy('action_date', 'desc')
      .execute();
    return logs as ActivityLog[];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch activity logs');
  }
});

// Insert a new activity log
export const insertActivityLog = createAsyncThunk<
  ActivityLog,
  {log: ActivityLog; db: Kysely<any>},
  {rejectValue: string}
>('activityLogs/insertActivityLog', async ({log, db}, {rejectWithValue}) => {
  try {
    const result = await db
      .insertInto(ACTIVITY_LOG_TABLE)
      .values(log)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as ActivityLog;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to insert activity log');
  }
});

// Delete an activity log
export const deleteActivityLog = createAsyncThunk<
  string, // ID of the deleted activity log
  {id: string; db: Kysely<any>},
  {rejectValue: string}
>('activityLogs/deleteActivityLog', async ({id, db}, {rejectWithValue}) => {
  try {
    await db.deleteFrom(ACTIVITY_LOG_TABLE).where('id', '=', id).execute();
    return id; // Return the ID of the deleted log for local state update
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete activity log');
  }
});

// Create the activity log slice
const activityLogSlice = createSlice({
  name: 'activityLogs',
  initialState,
  reducers: {
    // Reducer for handling local updates (if needed)
    addActivityLog: (state, action) => {
      state.logs.push(action.payload);
    },
    updateActivityLogLocal: (state, action) => {
      const index = state.logs.findIndex(log => log.id === action.payload.id);
      if (index !== -1) state.logs[index] = action.payload;
    },
    deleteActivityLogLocal: (state, action) => {
      state.logs = state.logs.filter(log => log.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivityLogs.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on new fetch
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch activity logs';
      })
      .addCase(insertActivityLog.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on new insert
      })
      .addCase(insertActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.logs.push(action.payload);
      })
      .addCase(insertActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to insert activity log';
      })
      .addCase(deleteActivityLog.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on delete
      })
      .addCase(deleteActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = state.logs.filter(log => log.id !== action.payload);
      })
      .addCase(deleteActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete activity log';
      });
  },
});

// Export the actions and reducer
export const {addActivityLog, updateActivityLogLocal, deleteActivityLogLocal} =
  activityLogSlice.actions;
export default activityLogSlice.reducer;
