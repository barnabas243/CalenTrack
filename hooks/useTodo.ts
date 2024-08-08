import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@/app/store';
import {fetchTodos, updateTodos, deleteTodos, insertTodo} from '@/store/todo/slice';
import {
  fetchSections,
  deleteSectionById,
  insertSection,
  updateSectionName,
} from '@/store/section/slice';
import {TodoItem} from '@/store/todo/types';
import {SectionItem} from '@/store/section/types'; // Adjust the path as needed
import {useAuth} from './useAuth';

export const useTodo = () => {
  const dispatch: AppDispatch = useDispatch();
  const {user} = useAuth();
  const todos = useSelector((state: RootState) => state.todos.todos); // Access todos array
  const sections = useSelector((state: RootState) => state.sections.sections); // Access sections array

  useEffect(() => {
    if (user) {
      dispatch(fetchTodos(user.id)).unwrap();
      dispatch(fetchSections(user.id)).unwrap();
    }
  }, [user, dispatch]);

  // Todo actions
  const addNewTodo = async (todo: TodoItem) => {
    try {
      const resultAction = await dispatch(insertTodo(todo)).unwrap();
      console.log('Todo added:', resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const updateExistingTodos = async (todos: TodoItem[]) => {
    try {
      const resultAction = await dispatch(updateTodos(todos)).unwrap();
      console.log('Todos updated:', resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error updating todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingTodos = async (ids: string[]) => {
    try {
      const resultAction = await dispatch(deleteTodos(ids)).unwrap();
      console.log('Todos deleted:', resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error deleting todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  // Section actions
  const addNewSection = async (section: {name: string; user_id: string}) => {
    try {
      const resultAction = await dispatch(insertSection(section)).unwrap();
      console.log(resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const updateExistingSection = async (section: SectionItem) => {
    try {
      const resultAction = await dispatch(updateSectionName(section)).unwrap();
      console.log(resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingSection = async (id: number) => {
    try {
      const resultAction = await dispatch(deleteSectionById(id)).unwrap();
      console.log(resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  return {
    todos,
    sections,
    addNewTodo,
    updateExistingTodos,
    deleteExistingTodos,
    addNewSection,
    updateExistingSection,
    deleteExistingSection,
  };
};
