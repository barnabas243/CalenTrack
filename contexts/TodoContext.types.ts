import {Tables} from '@/utils/database.types';
import {ReactNode} from 'react';

/**
 * Defines the structure of a todo item in the application.
 * - `id`: Optional unique identifier for the todo item.
 * - `title`: Title or name of the todo item.
 * - `summary`: Brief description or summary of the todo item.
 * - `completed`: Indicates whether the todo item is completed (`true`) or not (`false`).
 * - `completed_at`: Optional date when the todo item was completed.
 * - `due_date`: Date when the todo item is due.
 * - `start_date`: Optional date when the todo item starts.
 * - `recurrence`: Optional recurrence pattern for the todo item (daily, weekly, etc.).
 * - `priority`: Priority level of the todo item (1 highest, 4 lowest).
 * - `section_id`: Identifier of the section to which the todo item belongs.
 * - `created_by`: User or entity who created the todo item.
 * - `parent_id`: Optional ID of the parent task if this todo item is a subtask.
 */
export interface TodoItem {
  id?: number;
  title: string;
  summary: string;
  completed: boolean;
  completed_at?: Date;
  due_date?: Date;
  start_date?: Date;
  recurrence?: RecurrenceType;
  priority: PriorityType;
  section_id?: number; // split section by this id
  created_by: string;
  parent_id?: number;
}

export interface SectionItem {
  id: number;
  name: string;
}
/**
 * Defines the context type for managing todo items within the application.
 * - `todos`: Array of all todo items.
 * - `addTodo`: Function to add a new todo item to the list.
 * - `deleteTodo`: Function to delete a todo item by its ID.
 * - `updateTodo`: Function to update an existing todo item.
 * - `overdueTodos`: Array of todo items that are overdue based on their due dates.
 * - `todayTodos`: Array of todo items that are due today.
 * - `completedTodos`: Array of todo items that are completed.
 */
export interface TodoContextType {
  todos: TodoItem[];
  sections: SectionItem[];
  addTodo: (newTodo: TodoItem) => void;
  deleteTodo: (todoId: number) => void;
  updateTodo: (updatedTodo: TodoItem) => void;
  toggleCompleteTodo: (todoId: number) => void;
  openEditBottomSheet: (selectedTodo: TodoItem) => void;
  closeEditBottomSheet: () => void;
  addSection: (newSectionName: string) => Tables<'sections'> | null;
  updateSectionName: (updatedSection: SectionItem) => void;
  deleteSection: (section_id: number) => Promise<boolean>;
  overdueTodos: TodoItem[];
  todayTodos: TodoItem[];
  completedTodos: TodoItem[];
  selectedTodo: TodoItem | null;
  todoSortedByDate: {[key: string]: TodoItem[]};
  setSelectedTodo: (todo: TodoItem | null) => void;
  setShowInputModal: (show: boolean) => void;
}

/**
 * Defines the recurrence pattern for a task.
 * - `type`: Specifies the recurrence frequency ('daily', 'weekly', 'biWeekly', 'monthly', 'yearly').
 * - `days`: Optional array of specific days in a week for weekly recurrence.
 * - `day`: Optional specific day for monthly recurrence.
 * - `dayOfMonth`: Optional specific day of the month for monthly or yearly recurrence.
 * - `month`: Optional specific month for yearly recurrence.
 */
export interface RecurrenceType {
  type: 'daily' | 'weekly' | 'biWeekly' | 'monthly' | 'yearly';
  days?: string[];
  day?: string;
  dayOfMonth?: number;
  month?: number;
}

/**
 * Defines the priority level of a task.
 * - Values: 1 (highest priority), 2, 3, 4 (lowest priority).
 */
export type PriorityType = '1' | '2' | '3' | '4';

/**
 * Props type for the TodoProvider component.
 * - `children`: ReactNode representing the child components to be wrapped by TodoProvider.
 */
export type ToDoProviderProps = {
  children: ReactNode;
};
