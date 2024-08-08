import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {supabase} from '@/utils/supabase'; // Adjust the path as needed
import {TodoItem} from './types'; // Adjust the path as needed

interface TodoState {
  todos: TodoItem[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

// Fetch todos
export const fetchTodos = createAsyncThunk<TodoItem[], string>('todos/fetchTodos', async userId => {
  const {data, error} = await supabase.from('todos').select('*').eq('created_by', userId);
  if (error) throw error;
  return data as TodoItem[];
});

// Insert a single todo
export const insertTodo = createAsyncThunk<TodoItem, TodoItem>('todos/insertTodo', async todo => {
  const {data, error} = await supabase.from('todos').insert([todo]).select();
  if (error) throw error;
  return data[0] as TodoItem;
});

// Batch update todos
export const updateTodos = createAsyncThunk<TodoItem[], TodoItem[]>(
  'todos/updateTodos',
  async todos => {
    const {data, error} = await supabase.from('todos').upsert(todos, {onConflict: 'id'}).select();
    if (error) throw error;
    return data as TodoItem[];
  },
);

// Batch delete todos
export const deleteTodos = createAsyncThunk<string[], string[]>(
  'todos/deleteTodos',
  async todoIds => {
    const {error} = await supabase.from('todos').delete().in('id', todoIds);
    if (error) throw error;
    return todoIds; // Returning the IDs of deleted todos
  },
);

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
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch todos';
      })
      .addCase(insertTodo.pending, state => {
        state.loading = true;
      })
      .addCase(insertTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.push(action.payload);
      })
      .addCase(insertTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to insert todo';
      })
      .addCase(updateTodos.pending, state => {
        state.loading = true;
      })
      .addCase(updateTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.map(
          todo => action.payload.find(updated => updated.id === todo.id) || todo,
        );
      })
      .addCase(updateTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update todos';
      })
      .addCase(deleteTodos.pending, state => {
        state.loading = true;
      })
      .addCase(deleteTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.filter(todo => !action.payload.includes(todo.id!));
      })
      .addCase(deleteTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete todos';
      });
  },
});

export const {addTodo, updateTodo, deleteTodo} = todoSlice.actions;
export default todoSlice.reducer;
