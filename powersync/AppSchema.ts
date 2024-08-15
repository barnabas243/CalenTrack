import {column, Schema, TableV2} from '@powersync/react-native';

export const TODO_TABLE = 'todos';
export const SECTION_TABLE = 'sections';

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
    section_id: column.integer,
    created_by: column.text,
  },
  {indexes: {section: ['section_id']}},
);

export const AppSchema = new Schema({
  todos,
  sections,
});

// export const AppSchema = new Schema([
//   new Table({
//     name: 'sections',
//     columns: [
//       new Column({name: 'created_at', type: column.text}),
//       new Column({name: 'name', type: column.text}),
//       new Column({name: 'user_id', type: column.text}),
//     ],
//   }),
//   new Table({
//     name: 'todos',
//     columns: [
//       new Column({name: 'created_at', type: column.text}),
//       new Column({name: 'completed_at', type: column.text}),
//       new Column({name: 'title', type: column.text}),
//       new Column({name: 'summary', type: column.text}),
//       new Column({name: 'completed', type: ColumnType.INTEGER}),
//       new Column({name: 'start_date', type: column.text}),
//       new Column({name: 'due_date', type: column.text}),
//       new Column({name: 'recurrence', type: column.text}),
//       new Column({name: 'priority', type: column.text}),
//       new Column({name: 'parent_id', type: column.text}),
//       new Column({name: 'section_id', type: ColumnType.INTEGER}),
//       new Column({name: 'created_by', type: column.text}),
//     ],
//   }),
// ]);

export type Database = (typeof AppSchema)['types'];
export type Todo = Database['todos'];
export type Section = Database['sections'];
