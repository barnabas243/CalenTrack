/**
 * Defines the structure of a todo item in the application.
 * - `id`: Optional unique identifier for the todo item.
 * - `title`: Title or name of the todo item.
 * - `summary`: Brief description or summary of the todo item.
 * - `completed`: Indicates whether the todo item is completed (`true`) or not (`false`).
 * - `completed_at`: Optional date when the todo item was completed.
 * - `due_date`: Date when the todo item is due.
 * - `start_date`: Optional date when the todo item starts.
 * - `recurrence`: Optional recurrence pattern for the todo item using rrules.
 * - `priority`: Priority level of the todo item (1 highest, 4 lowest).
 * - `section_id`: Identifier of the section to which the todo item belongs.
 * - `created_by`: User or entity who created the todo item.
 * - `parent_id`: Optional ID of the parent task if this todo item is a subtask.
 */
export interface TodoItem {
  id?: string;
  title: string;
  summary: string;
  completed: boolean;
  completed_at?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  recurrence?: string;
  priority: PriorityType;
  section_id?: number | null; // Use string to match the database type
  created_by: string;
  parent_id?: string | null; // Use string to match the database type
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
 * @see TodoItem
 */
export interface MonthlyTodo {
  dueDate: string;
  data: TodoItem[];
}
