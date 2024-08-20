import {TodoItem} from '../types';

const mockTodos: TodoItem[] = [
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
  {
    id: '2',
    title: 'Sample Todo 2',
    created_by: 'user2',
    summary: 'This is a summary of Sample Todo 2',
    completed: true,
    priority: '2',
    due_date: '2024-09-15',
    section_id: 2,
    start_date: '2024-08-15',
    recurrence: 'weekly',
    parent_id: '1', // referring to the first todo as a parent
  },
  {
    id: '3',
    title: 'Sample Todo 3',
    created_by: 'user1',
    summary: 'This is a summary of Sample Todo 3',
    completed: false,
    priority: '3',
    due_date: '2024-10-01',
    section_id: 1,
    start_date: '2024-09-01',
    recurrence: 'monthly',
    parent_id: null,
  },
];

export default mockTodos;
