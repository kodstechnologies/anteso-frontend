import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import userConfigSlice from './userConfigSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

// Redux Persist configuration
const persistConfig = {
    key: 'anteso',
    storage,
};

// Apply persistReducer to userConfigSlice
const persistedReducer = persistReducer(persistConfig, userConfigSlice);

// Combine reducers
const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    userConfig: persistedReducer,
});

// Create the Redux store with serializable check ignored for redux-persist
const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'], // Ignore redux-persist actions
            },
        }),
});

// Persist the store
export const persistor = persistStore(store);

export default store;

// TypeScript type for the root state
export type IRootState = ReturnType<typeof rootReducer>;
