import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ContentPage } from './pages/ContentPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GamificationPage } from './pages/GamificationPage';
import { WhitelistPage } from './pages/WhitelistPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { LegalDocsPage } from './pages/LegalDocsPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { useAdminAuth } from './hooks/useAdminAuth';

export default function App() {
  const { isAdmin, loading, error, signIn, signOut } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-tertiary">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginPage onLogin={signIn} error={error} loading={loading} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onSignOut={signOut} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/whitelist" element={<WhitelistPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/legal" element={<LegalDocsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
