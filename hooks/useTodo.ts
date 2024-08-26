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
import {Section, SECTION_TABLE, Todo, TODO_TABLE} from '@/powersync/AppSchema';
import {generateUUID} from '@/powersync/uuid';

export const useTodo = () => {
  const dispatch: AppDispatch = useDispatch();
  const {user} = useAuth();
  const todos = useSelector((state: RootState) => state.todos.todos); // Access todos array
  const sections = useSelector((state: RootState) => state.sections.sections); // Access sections array

  const {db, supabaseConnector} = useSystem();

  useEffect(() => {
    if (user) {
      dispatch(fetchTodos({userId: user.id, db})).unwrap();
      dispatch(fetchSections({userId: user.id, db})).unwrap();
    }
  }, [user, dispatch, db]);

  useEffect(() => {
    const todoChannel = supabaseConnector.client
      .channel(TODO_TABLE)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
        },
        payload => console.log('received todo insert event: ', payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
        },
        payload => console.log('received todo update event: ', payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
        },
        payload => console.log('received todo delete event: ', payload),
      )
      .subscribe();

    const sectionChannel = supabaseConnector.client
      .channel(SECTION_TABLE)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
        },
        payload => console.log('received section insert event: ', payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
        },
        payload => console.log('received section update event: ', payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
        },
        payload => console.log('received section delete event: ', payload),
      );
    return () => {
      todoChannel.unsubscribe();
      sectionChannel.unsubscribe();
    };
  }, [supabaseConnector]);

  // Todo actions
  const addNewTodo = async (todo: Todo) => {
    try {
      const resultAction = await dispatch(insertTodo({todo, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const updateExistingTodos = async (todo: Todo) => {
    try {
      const resultAction = await dispatch(powerSyncUpdateTodo({todo, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error updating todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingTodos = async (id: string) => {
    try {
      const resultAction = await dispatch(powerSyncDeleteTodo({todoId: id, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error deleting todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  // Section actions
  const addNewSection = async (section: {name: string; user_id: string}) => {
    try {
      const newSection = {...section, created_at: new Date().toISOString(), id: generateUUID()};
      const resultAction = await dispatch(insertSection({newSection, db})).unwrap();
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
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const deleteExistingSection = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteSectionById({id, db})).unwrap();
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
