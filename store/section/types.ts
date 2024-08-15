import {Todo} from '@/powersync/AppSchema';

/**
 * Defines the structure of a section containing todo items.
 * - `key`: Unique key for identifying the section in lists.
 * - `name`: Display name of the section.
 * - `data`: Array of todo items that belong to this section.
 * @see Todo
 */
export interface SectionWithTodos {
  key: string;
  name: string;
  data: Todo[];
}
