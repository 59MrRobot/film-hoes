import { configureStore } from '@reduxjs/toolkit';
import nominateReducer from './slices/nominateSlice';

export const store = configureStore({
  reducer: {
    nominate: nominateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
