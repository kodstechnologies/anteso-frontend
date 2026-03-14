import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

// Redux
import { Provider } from 'react-redux';
import store, { persistor } from './store/index';
import { PersistGate } from 'redux-persist/integration/react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <Provider store={store}>
                <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                    <RouterProvider router={router} />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 5000,
                            style: {
                                borderRadius: '12px',
                                padding: '14px 18px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                maxWidth: '420px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                            },
                            success: {
                                style: { background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' },
                                iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
                            },
                            error: {
                                duration: 5500,
                                style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
                                iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
                            },
                        }}
                    />
                </PersistGate>
            </Provider>
        </Suspense>
    </React.StrictMode>
);
