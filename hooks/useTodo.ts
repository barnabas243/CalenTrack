import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@/app/store';
import {fetchTodos, powerSyncUpdateTodo, powerSyncDeleteTodo, insertTodo} from '@/store/todo/slice';
import {
  fetchSections,
  deleteSectionById,
  insertSection,
  updateSectionName,
} from '@/store/section/slice';
import {useAuth} from './useAuth';
import {useSystem} from '@/powersync/system';
import {Section, Todo} from '@/powersync/AppSchema';

export const useTodo = () => {
  const dispatch: AppDispatch = useDispatch();
  const {user} = useAuth();
  const todos = useSelector((state: RootState) => state.todos.todos); // Access todos array
  const sections = useSelector((state: RootState) => state.sections.sections); // Access sections array

  const {db} = useSystem();

  useEffect(() => {
    if (user) {
      dispatch(fetchTodos({userId: user.id, db})).unwrap();
      dispatch(fetchSections({userId: user.id, db})).unwrap();
    }
  }, [user, dispatch, db]);

  // Todo actions
  const addNewTodo = async (todo: Todo) => {
    try {
      const resultAction = await dispatch(insertTodo({todo, db})).unwrap();
      console.log('Todo added:', resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const updateExistingTodos = async (todo: Todo) => {
    try {
      const resultAction = await dispatch(powerSyncUpdateTodo({todo, db})).unwrap();
      console.log('Todo updated:', resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error updating todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingTodos = async (id: string) => {
    try {
      const resultAction = await dispatch(powerSyncDeleteTodo({todoId: id, db})).unwrap();
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
      const resultAction = await dispatch(insertSection({newSection: section, db})).unwrap();
      console.log(resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const updateExistingSection = async (section: Section) => {
    try {
      const resultAction = await dispatch(
        updateSectionName({updatedSection: section, db}),
      ).unwrap();
      console.log(resultAction);
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingSection = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteSectionById({id, db})).unwrap();
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
