import {Todo} from '@/powersync/AppSchema';
import dayjs from 'dayjs';
import {SortByType, SortDirectionType} from './settingUtils';

export const filterTodos = (sortedTodos: Todo[], filterType: 'overdue' | 'today' | 'completed') => {
  const todayDate = dayjs();

  switch (filterType) {
    case 'overdue':
      return sortedTodos.filter(
        todo =>
          dayjs(todo.due_date).isValid() &&
          todo.completed === 0 &&
          dayjs(todo.due_date).isBefore(todayDate, 'day'),
      );
    case 'today':
      return sortedTodos.filter(
        todo =>
          dayjs(todo.due_date).isValid() &&
          todo.completed === 0 &&
          dayjs(todo.due_date).isSame(todayDate, 'day'),
      );
    case 'completed':
      return sortedTodos.filter(todo => todo.completed === 1);
    default:
      return [];
  }
};

export const sortTodos = (
  todos: Todo[],
  sortBy: SortByType,
  direction: SortDirectionType = 'asc',
) => {
  // Pre-sort by completed status for better efficiency in some cases
  const sortedTodosByCompleted = todos.slice().sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  // Apply additional sorting criteria
  const finalSortedTodos = sortedTodosByCompleted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = dayjs(a.due_date).diff(dayjs(b.due_date));
        break;
      case 'title':
        comparison = a.title!.localeCompare(b.title!);
        break;
      case 'section':
        comparison = (a.section_id ?? '').localeCompare(b.section_id ?? '');
        break;
      case 'priority':
        comparison = (Number(a.priority) ?? 0) - (Number(b.priority) ?? 0);
        break;
      default:
        comparison = 0;
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });

  return finalSortedTodos;
};
