import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '@/app/store';
import {
  fetchTodos,
  powerSyncUpdateTodo,
  powerSyncDeleteTodo,
  insertTodo,
  updateTodo,
  deleteTodo,
  powerSyncToggleTodoComplete,
} from '@/store/todo/slice';
import {
  fetchSections,
  deleteSectionById,
  insertSection,
  updateSectionName,
} from '@/store/section/slice';
import {useAuth} from './useAuth';
import {useSystem} from '@/powersync/system';
import {ActivityLog, Section, SECTION_TABLE, Todo, TODO_TABLE} from '@/powersync/AppSchema';
import {deleteActivityLog, fetchActivityLogs, insertActivityLog} from '@/store/activityLog/slice';

export const useTodo = () => {
  const dispatch: AppDispatch = useDispatch();
  const {user} = useAuth();
  const todos = useSelector((state: RootState) => state.todos.todos); // Access todos array
  const sections = useSelector((state: RootState) => state.sections.sections); // Access sections array
  const activityLogs = useSelector((state: RootState) => state.activityLogs.logs); // Access activity logs array

  const {db, supabaseConnector} = useSystem();

  useEffect(() => {
    if (user) {
      dispatch(fetchTodos({db})).unwrap();
      dispatch(fetchSections({db})).unwrap();
      dispatch(fetchActivityLogs({db})).unwrap();
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
        payload => {
          console.log('received todo insert event: ', payload);
          updateTodo(payload.new);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
        },
        payload => {
          console.log('received todo update event: ', payload.new);
          updateTodo(payload.new);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
        },
        payload => {
          console.log('received todo delete event: ', payload.new);
          deleteTodo(payload.new);
        },
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

  const toggleBatchCompleteTodo = async (todoIDs: string[], completed: number) => {
    try {
      const resultAction = await dispatch(
        powerSyncToggleTodoComplete({todoIDs, completed, db}),
      ).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error updating todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };
  const deleteExistingTodos = async (ids: string[]) => {
    try {
      const resultAction = await dispatch(powerSyncDeleteTodo({todoIds: ids, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error('Error deleting todos:', error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  // Section actions
  const addNewSection = async (section: {name: string; user_id: string}) => {
    try {
      const uuid = await supabaseConnector.generateUUID();

      const newSection = {...section, created_at: new Date().toISOString(), id: uuid};
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

  //activity log actions
  const createActivityLogs = async (logs: ActivityLog[]) => {
    try {
      const updatedLogs = await Promise.all(
        logs.map(async log => {
          const uuid = await supabaseConnector.generateUUID();
          return {...log, id: uuid};
        }),
      );
      const resultAction = await dispatch(insertActivityLog({logs: updatedLogs, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  const removeActivityLog = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteActivityLog({id, db})).unwrap();
      return resultAction; // Return the result
    } catch (error) {
      console.error(error);
      throw error; // Re-throw error for higher-level handling
    }
  };

  return {
    todos,
    sections,
    activityLogs,
    addNewTodo,
    updateExistingTodos,
    toggleBatchCompleteTodo,
    deleteExistingTodos,
    addNewSection,
    updateExistingSection,
    deleteExistingSection,
    createActivityLogs,
    removeActivityLog,
  };
};
