import {Todo} from '@/powersync/AppSchema';

/**
 * Define the initial state for the todo slice.
 */
export interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

/**
 * Defines the priority level of a task.
 * - Values: 1 (highest priority), 2, 3, 4 (lowest priority).
 */
export type PriorityType = '1' | '2' | '3' | '4';

/**
 * Defines the structure of a monthly todo list.
 * - `dueDate`: Date when the todo items are due.
 * - `data`: Array of todo items due on the specified date.
 * @see Todo
 */
export interface MonthlyTodo {
  dueDate: string;
  data: Todo[];
}
