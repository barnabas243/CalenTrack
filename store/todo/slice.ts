import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Todo, TODO_TABLE} from '@/powersync/AppSchema';
import {Kysely} from '@powersync/kysely-driver';
import {TodoState} from './types';

/**
 * Initial state for the todo slice.
 */
const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

/**
 * Thunk to fetch todos for a given user ID from the database.
 * @param userId - The ID of the user whose todos are to be fetched.
 * @param db - The database instance to use for the query.
 * @returns A promise that resolves to an array of todos.
 */
export const fetchTodos = createAsyncThunk<Todo[], {db: Kysely<any>}, {rejectValue: string}>(
  'todos/fetchTodos',
  async ({db}, {rejectWithValue}) => {
    try {
      const todos = await db.selectFrom(TODO_TABLE).selectAll().execute();
      return todos as Todo[];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch todos');
    }
  },
);

/**
 * Thunk to insert a new todo into the database.
 * @param todo - The todo object to be inserted.
 * @param db - The database instance to use for the insertion.
 * @returns A promise that resolves to the inserted todo.
 */
export const insertTodo = createAsyncThunk<
  Todo,
  {todo: Todo; db: Kysely<any>},
  {rejectValue: string}
>('todos/insertTodo', async ({todo, db}, {rejectWithValue}) => {
  try {
    const result = await db
      .insertInto(TODO_TABLE)
      .values(todo)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result as Todo;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to insert todo');
  }
});

/**
 * Thunk to update an existing todo in the database.
 * @param todo - The todo object with updated fields.
 * @param db - The database instance to use for the update.
 * @returns A promise that resolves to the updated todo.
 */
export const powerSyncUpdateTodo = createAsyncThunk<
  Todo,
  {todo: Todo; db: Kysely<any>},
  {rejectValue: string}
>('todos/powerSyncUpdateTodo', async ({todo, db}, {rejectWithValue}) => {
  try {
    const result = await db
      .updateTable(TODO_TABLE)
      .set(todo)
      .where('id', '=', todo.id)
      .returningAll()
      .executeTakeFirst();

    return result as Todo;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update todo');
  }
});

export const powerSyncToggleTodoComplete = createAsyncThunk<
  Todo[],
  {todoIDs: string[]; completed: number; db: Kysely<any>},
  {rejectValue: string}
>('todos/powerSyncToggleTodoComplete', async ({todoIDs, completed, db}, {rejectWithValue}) => {
  try {
    const results = await db
      .updateTable(TODO_TABLE)
      .set({
        completed: completed,
        completed_at: completed === 1 ? new Date().toISOString() : null,
      })
      .where('id', 'in', todoIDs)
      .returningAll()
      .execute();

    return results as Todo[];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update todo');
  }
});

/**
 * Thunk to delete todos by their IDs from the database.
 * @param todoIds - The IDs of the todos to be deleted.
 * @param db - The database instance to use for the deletion.
 * @returns A promise that resolves to an array of IDs of the deleted todos.
 */
export const powerSyncDeleteTodo = createAsyncThunk<
  string[], // The type of the return value (array of deleted todo IDs)
  {todoIds: string[]; db: Kysely<any>}, // The type of the thunk argument
  {rejectValue: string} // The type of the reject value
>('todos/powerSyncDeleteTodo', async ({todoIds, db}, {rejectWithValue}) => {
  try {
    // Perform batch deletion
    const results = await db
      .deleteFrom(TODO_TABLE)
      .where('id', 'in', todoIds)
      .returning('id') // Return the IDs of the deleted todos
      .execute();

    // Check if results exist
    if (!results.length) {
      throw new Error('No todos found for the given IDs');
    }

    // Return the deleted todo IDs
    return results.map(result => result.id); // Adjust according to the actual structure of results
  } catch (error) {
    // Handle errors and return a reject value
    return rejectWithValue(error.message || 'Failed to delete todos');
  }
});

/**
 * Create the todo slice using Redux Toolkit.
 */
const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    /**
     * Reducer to add a new todo to the state.
     * @param state - The current state.
     * @param action - The action containing the new todo.
     */
    addTodo: (state, action) => {
      state.todos.push(action.payload);
    },
    /**
     * Reducer to update an existing todo in the state.
     * @param state - The current state.
     * @param action - The action containing the updated todo.
     */
    updateTodo: (state, action) => {
      const index = state.todos.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) state.todos[index] = action.payload;
    },
    /**
     * Reducer to delete a todo from the state.
     * @param state - The current state.
     * @param action - The action containing the ID of the todo to be deleted.
     */
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTodos.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on new fetch
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch todos';
      })
      .addCase(insertTodo.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on new insert
      })
      .addCase(insertTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.push(action.payload);
      })
      .addCase(insertTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to insert todo';
      })
      .addCase(powerSyncUpdateTodo.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on update
      })
      .addCase(powerSyncUpdateTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo,
        );
      })
      .addCase(powerSyncUpdateTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update todos';
      })
      .addCase(powerSyncToggleTodoComplete.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on update
      })
      .addCase(powerSyncToggleTodoComplete.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.map(todo => action.payload.find(t => t.id === todo.id) || todo);
      })
      .addCase(powerSyncToggleTodoComplete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update todos';
      })
      .addCase(powerSyncDeleteTodo.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on delete
      })
      .addCase(powerSyncDeleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure action.payload is an array of deleted IDs
        const deletedTodoIds = action.payload as string[];
        // Filter out todos whose IDs are in the array of deleted IDs
        state.todos = state.todos.filter(todo => !deletedTodoIds.includes(todo.id));
      })

      .addCase(powerSyncDeleteTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete todos';
      });
  },
});

/**
 * Export the actions generated by the slice.
 */
export const {addTodo, updateTodo, deleteTodo} = todoSlice.actions;

/**
 * Export the reducer for the todo slice.
 */
export default todoSlice.reducer;
