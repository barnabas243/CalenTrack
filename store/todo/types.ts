import {Todo} from '@/powersync/AppSchema';

/**
 * Defines the priority level of a task.
 * - Values: 1 (highest priority), 2, 3, 4 (lowest priority).
 */
export type PriorityType = '1' | '2' | '3' | '4';

/**
 * Defines the structure of a monthly todo list.
 * - `dueDate`: Date when the todo items are due.
 * - `data`: Array of todo items due on the specified date.
 * @see TodoItem
 */
export interface MonthlyTodo {
  dueDate: string;
  data: Todo[];
}
