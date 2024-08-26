import {column, Schema, TableV2} from '@powersync/react-native';

// Define table names as constants for easy reference
export const TODO_TABLE = 'todos';
export const SECTION_TABLE = 'sections';
export const PROFILE_TABLE = 'profiles';

/**
 * Define the schema for the app
 * The schema consists of tables, columns, and indexes
 */

/**
 * Profiles table schema
 * @property {string} updated_at - Timestamp of the last update
 * @property {string} full_name - Full name of the user
 * @property {string} avatar_url - URL to the user's avatar
 * @property {string} expoPushToken - Expo push token for notifications
 */
const profiles = new TableV2({
  updated_at: column.text,
  full_name: column.text,
  avatar_url: column.text,
  expoPushToken: column.text,
});

/**
 * Sections table schema
 * @property {string} created_at - Timestamp of creation
 * @property {string} name - Name of the section
 * @property {string} user_id - ID of the user who owns the section
 */
const sections = new TableV2({
  created_at: column.text,
  name: column.text,
  user_id: column.text,
});

export type ReminderOption =
  | 'At Time of Event'
  | '10 Minutes Before'
  | '1 Hour Before'
  | '1 Day Before';

/**
 * Todos table schema
 * @property {string} created_at - Timestamp of creation
 * @property {string} completed_at - Timestamp of completion
 * @property {string} title - Title of the todo
 * @property {string} summary - Summary of the todo
 * @property {number} completed - Completion status (0 or 1). powersync does not support boolean types
 * @property {string} start_date - Start date of the todo
 * @property {string} due_date - Due date of the todo
 * @property {string} recurrence - Recurrence pattern
 * @property {string} priority - Priority level
 * @property {string} parent_id - ID of the parent todo
 * @property {string} section_id - ID of the section the todo belongs to
 * @property {string} created_by - ID of the user who created the todo
 * @property {string} reminder_option - Reminder option for the todo
 * @property {string} notification_id - ID of the scheduled notification
 */
const todos = new TableV2(
  {
    created_at: column.text,
    completed_at: column.text,
    title: column.text,
    summary: column.text,
    completed: column.integer,
    start_date: column.text,
    due_date: column.text,
    recurrence: column.text,
    priority: column.text,
    parent_id: column.text,
    section_id: column.text,
    created_by: column.text,
    reminder_option: column.text,
    notification_id: column.text,
  },
  {indexes: {section: ['section_id'], notification: ['notification_id']}},
);

const notification = new TableV2(
  {
    created_at: column.text,
    todo_id: column.text,
    title: column.text,
    body: column.text,
    sound: column.integer,
    trigger_time: column.text,
  },
  {indexes: {todo: ['todo_id']}},
);
/**
 * AppSchema definition
 * Combines all the tables into a single schema
 */
export const AppSchema = new Schema({
  todos,
  sections,
  profiles,
  notification,
});

/**
 * Type definitions for the database tables
 */
export type Database = (typeof AppSchema)['types'];
export type Todo = Database['todos'];
export type Section = Database['sections'];
export type Profile = Database['profiles'];
