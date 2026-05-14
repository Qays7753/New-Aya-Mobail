import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { initDatabase } from './db/client';
import { runMigrations } from './db/migrations';
import { isPinSet, checkPin } from './lib/pin';
import { Shell } from './components/layout/Shell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import DashboardPage from './modules/dashboard/DashboardPage';
import POSPage from './modules/pos/POSPage';
import ProductsPage from './modules/products/ProductsPage';
import InventoryPage from './modules/inventory/InventoryPage';
import ExpensesPage from './modules/expenses/ExpensesPage';
import SalesPage from './modules/sales/SalesPage';
import OperationsPage from './modules/operations/OperationsPage';
import MaintenancePage from './modules/maintenance/MaintenancePage';
import ReportsPage from './modules/reports/ReportsPage';
import MorePage from './modules/more/MorePage';
import SettingsPage from './modules/settings/SettingsPage';

// Create a client ensuring networkMode: 'always' for offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      retry: false,
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';

export default function App() {
  const [dbState, setDbState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function setup() {
      if (navigator.storage && navigator.storage.persist) {
        try {
          const isPersisted = await navigator.storage.persisted();
          if (!isPersisted) {
            await navigator.storage.persist();
          }
        } catch (e) {
          console.warn('Storage persistence check failed', e);
        }
      }

      try {
        await initDatabase();
        await runMigrations();
        
        // Removed old checkPin call here since AuthProvider handles it
        setDbState('ready');
      } catch (err: any) {
        setDbState('error');
        setErrorMsg(err.message || 'Unknown database error');
      }
    }
    setup();
  }, []);

  if (dbState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary text-lg">جاري تجهيز قاعدة البيانات...</p>
        </div>
      </div>
    );
  }

  if (dbState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-text-primary">
        <div className="bg-danger-bg border border-danger text-danger p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">خطأ في قاعدة البيانات</h2>
          <p className="mb-4">{errorMsg}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-danger text-white px-6 py-2 rounded-md hover:bg-opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <BrowserRouter>
            <Routes>
              <Route element={<Shell />}>
                {/* Public/Employee Routes */}
                <Route path="/pos" element={<POSPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/more" element={<MorePage />} />
                
                {/* Protected/Admin Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/operations" element={<OperationsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Default redirect to POS */}
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="*" element={<Navigate to="/pos" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" dir="rtl" />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}

