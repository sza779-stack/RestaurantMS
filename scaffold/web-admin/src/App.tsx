import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useStore } from './hooks/useStore';
import PosPage from './pages/pos/PosPage';
import LoginPage from './pages/auth/LoginPage';
import Layout from './components/Layout';
import { WebSocketProvider } from './components/WebSocketProvider';
import {
  SettingsLayout,
  StockManagement,
  MenuManagement,
  DeliveryManagement,
  AnalyticsReports,
  StaffSuggestions,
  HRManagement,
  CustomerManagement,
  GeneralSettings,
  DataManagement,
  GlobalInsights,
  UserManagement,
  SecuritySettings,
} from './pages/settings';

function App() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <WebSocketProvider>
      <Toaster richColors position="top-center" />
      <Layout>
        <Routes>
          <Route path="/pos" element={<PosPage />} />
          
          {/* Settings Routes */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/global-insights" replace />} />
            <Route path="global-insights" element={<GlobalInsights />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="delivery" element={<DeliveryManagement />} />
            <Route path="dispatch" element={<Navigate to="/settings/delivery" replace />} />
            <Route path="analytics" element={<AnalyticsReports />} />
            <Route path="suggestions" element={<StaffSuggestions />} />
            <Route path="hr" element={<HRManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="general" element={<GeneralSettings />} />
            <Route path="data" element={<DataManagement />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/pos" replace />} />
        </Routes>
      </Layout>
    </WebSocketProvider>
  );
}

export default App;
