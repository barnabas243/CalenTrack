import {TodoItem} from '../todo/types';

/**
 * Defines the structure of a section item in the application.
 * - `id`: Unique identifier for the section.
 * - `name`: Name of the section.
 * - `user_id`: Identifier of the user who created the section.
 * - `created_at`: Timestamp indicating when the section was created.
 */
export interface SectionItem {
  id: number;
  name: string;
  user_id: string;
  created_at: string;
}

/**
 * Defines the structure of a section containing todo items.
 * - `key`: Unique key for identifying the section in lists.
 * - `name`: Display name of the section.
 * - `data`: Array of todo items that belong to this section.
 * @see TodoItem
 */
export interface Section {
  key: string;
  name: string;
  data: TodoItem[];
}
