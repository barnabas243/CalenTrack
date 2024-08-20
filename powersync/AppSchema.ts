import {column, Schema, TableV2} from '@powersync/react-native';

export const TODO_TABLE = 'todos';
export const SECTION_TABLE = 'sections';
export const PROFILE_TABLE = 'profiles';

const profiles = new TableV2({
  updated_at: column.text,
  full_name: column.text,
  avatar_url: column.text,
  expoPushToken: column.text,
});

const sections = new TableV2({
  created_at: column.text,
  name: column.text,
  user_id: column.text,
});
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
  },
  {indexes: {section: ['section_id']}},
);

export const AppSchema = new Schema({
  todos,
  sections,
  profiles,
});

export type Database = (typeof AppSchema)['types'];
export type Todo = Database['todos'];
export type Section = Database['sections'];
export type Profile = Database['profiles'];
