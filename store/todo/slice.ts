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

/**
 * Thunk to delete a todo by its ID from the database.
 * @param todoId - The ID of the todo to be deleted.
 * @param db - The database instance to use for the deletion.
 * @returns A promise that resolves to the ID of the deleted todo.
 */
export const powerSyncDeleteTodo = createAsyncThunk<
  string,
  {todoId: string; db: Kysely<any>},
  {rejectValue: string}
>('todos/powerSyncDeleteTodo', async ({todoId, db}, {rejectWithValue}) => {
  try {
    const result = await db.deleteFrom(TODO_TABLE).where('id', '=', todoId).executeTakeFirst();
    if (!result) throw new Error('Todo not found');
    return todoId;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete todo');
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
      .addCase(powerSyncDeleteTodo.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on delete
      })
      .addCase(powerSyncDeleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.filter(todo => todo.id !== action.payload);
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
