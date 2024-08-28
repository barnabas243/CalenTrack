import {Section, Todo} from '@/powersync/AppSchema';

/**
 * Define the initial state for the section slice.
 */
export interface SectionState {
  sections: Section[];
  loading: boolean;
  error: string | null;
}
/**
 * Defines the structure of a section containing todo items.
 *
 * @property {string} key - Unique key for identifying the section in lists.
 * @property {string} name - Display name of the section.
 * @property {Todo[]} data - Array of todo items that belong to this section.
 *
 * @see Todo
 */
export interface SectionWithTodos {
  key: string;
  name: string;
  data: Todo[];
}
