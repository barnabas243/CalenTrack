import store from '@/app/store';
import {fetchTodos, insertTodo} from '../slice';
import {PriorityType} from '../types';

jest.mock('@supabase/supabase-js', () => {
  let tablesData: {[key: string]: any[]} = {
    todos: [
      {
        id: '1',
        title: 'Sample Todo 1',
        created_by: 'user1',
        summary: 'This is a summary of Sample Todo 1',
        completed: false,
        priority: '1',
        due_date: '2024-08-30',
        section_id: 1,
        start_date: '2024-08-01',
        recurrence: 'daily',
        parent_id: null,
      },
    ],
    // Add other table mocks here if needed
  };

  return {
    createClient: jest.fn().mockImplementation(() => {
      return {
        from: jest.fn().mockImplementation((tableName: string) => {
          return {
            select: jest.fn().mockImplementation(() => ({
              eq: jest.fn().mockImplementation(() => ({
                data: tablesData[tableName] || [], // Return data for the specific table
                error: null,
              })),
              in: jest.fn().mockImplementation(() => ({
                data: tablesData[tableName] || [], // Return data for the specific table
                error: null,
              })),
              data: tablesData[tableName] || [], // Default data for select
              error: null,
            })),
            insert: jest.fn().mockImplementation((newData: any[]) => {
              tablesData[tableName] = [...tablesData[tableName], ...newData];
              return {
                data: newData,
                error: null,
              };
            }),
            update: jest.fn().mockImplementation((updates: any[]) => {
              tablesData[tableName] = tablesData[tableName].map(
                item => updates.find((update: any) => update.id === item.id) || item,
              );
              return {
                data: tablesData[tableName],
                error: null,
              };
            }),
            delete: jest.fn().mockImplementation((ids: string[]) => {
              tablesData[tableName] = tablesData[tableName].filter(item => !ids.includes(item.id));
              return {
                data: [],
                error: null,
              };
            }),
          };
        }),
      };
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('Todo Slice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle fetchTodos for the todos table', async () => {
    const mockTodos = [
      {
        id: '1',
        title: 'Sample Todo 1',
        created_by: 'user1',
        summary: 'This is a summary of Sample Todo 1',
        completed: false,
        priority: '1',
        due_date: '2024-08-30',
        section_id: 1,
        start_date: '2024-08-01',
        recurrence: 'daily',
        parent_id: null,
      },
    ];
    // supabase.from('todos').select().mockResolvedValue({data: mockTodos, error: null});

    await store.dispatch(fetchTodos('user1'));
    expect(store.getState().todos.todos).toEqual(mockTodos);
  });

  it('should handle insertTodo into the todos table', async () => {
    const newTodo = {
      id: '2',
      title: 'Sample Todo 2',
      created_by: 'user2',
      summary: 'This is a summary of Sample Todo 2',
      completed: true,
      priority: '2' as PriorityType,
      due_date: '2024-09-15',
      section_id: 2,
      start_date: '2024-08-15',
      recurrence: 'weekly',
      parent_id: '1', // referring to the first todo as a parent
    };
    // supabase.from('todos').insert([newTodo]).select();

    const result = await store.dispatch(insertTodo(newTodo));
    expect(result).toEqual(newTodo);
  });

  // Additional tests for update and delete can be similarly adjusted
});
