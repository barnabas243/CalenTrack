import {configureStore} from '@reduxjs/toolkit';
import todoReducer from '@/store/todo/slice';
import sectionReducer from '@/store/section/slice';

const store = configureStore({
  reducer: {
    todos: todoReducer,
    sections: sectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
