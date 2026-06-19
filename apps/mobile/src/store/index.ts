import { combineReducers, configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import { api } from '../services/api';
import authReducer from './slices/authSlice';
import onboardingReducer from './slices/onboardingSlice';
import networkReducer from './slices/networkSlice';
import downloadsReducer from './slices/downloadsSlice';
import outboxReducer from './slices/outboxSlice';

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  onboarding: onboardingReducer,
  network: networkReducer,
  downloads: downloadsReducer,
  outbox: outboxReducer,
});

// Persist only what makes offline work: the RTK Query cache (lesson/exercise
// content), the downloaded-media registry, and the pending-write outbox.
// `auth` stays in SecureStore (see secureStorage) and `network` is ephemeral.
const persistConfig = {
  key: 'lexiroot-root',
  version: 1,
  storage: AsyncStorage,
  whitelist: [api.reducerPath, 'downloads', 'outbox'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these internal actions with non-serializable
        // payloads — exempt them from the serializability check.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
