import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Todo, TODO_TABLE} from '@/powersync/AppSchema';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

// Fetch todos
export const fetchTodos = createAsyncThunk<
  Todo[],
  {userId: string; db: any},
  {rejectValue: string}
>('todos/fetchTodos', async ({userId, db}, {rejectWithValue}) => {
  try {
    // Use the db instance to fetch todos
    console.log('Fetching todos for user:', userId);
    const todos = await db.selectFrom(TODO_TABLE).selectAll().execute();

    return todos as Todo[];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch todos');
  }
});
// Insert a single todo
export const insertTodo = createAsyncThunk<Todo, {todo: Todo; db: any}, {rejectValue: string}>(
  'todos/insertTodo',
  async ({todo, db}, {rejectWithValue}) => {
    try {
      // Use the db instance to insert the todo
      console.log('Inserting todo:', todo);
      const result = await db
        .insertInto(TODO_TABLE)
        .values(todo)
        .returningAll()
        .executeTakeFirstOrThrow();

      return result as Todo;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to insert todo');
    }
  },
);

// update todo
export const powerSyncUpdateTodo = createAsyncThunk<
  Todo,
  {todo: Todo; db: any},
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

// delete todo
export const powerSyncDeleteTodo = createAsyncThunk<
  string,
  {todoId: string; db: any},
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

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.todos.push(action.payload);
    },
    updateTodo: (state, action) => {
      const index = state.todos.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) state.todos[index] = action.payload;
    },
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
        state.error = (action.payload as string) || 'Failed to fetch todos';
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
        state.error = (action.payload as string) || 'Failed to insert todo';
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
        state.error = (action.payload as string) || 'Failed to update todos';
      })
      .addCase(powerSyncDeleteTodo.pending, state => {
        state.loading = true;
        state.error = null; // Clear error on delete
      })
      .addCase(powerSyncDeleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.filter(todo => !action.payload.includes(todo.id!));
      })
      .addCase(powerSyncDeleteTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to delete todos';
      });
  },
});

export const {addTodo, updateTodo, deleteTodo} = todoSlice.actions;
export default todoSlice.reducer;
