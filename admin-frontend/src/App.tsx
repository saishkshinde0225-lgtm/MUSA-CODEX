import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenterTab } from './components/CommandCenterTab';
import { ComplaintsTab } from './components/ComplaintsTab';
import { SafetyRadarMatrix } from './components/SafetyRadarMatrix';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AuthGate } from './components/AuthGate';
import type { AdminSummaryResponse, AdminComplaintItem, ComplaintStatus, OperatorSession } from './types/admin';
import { fetchAdminSummary, fetchAdminComplaints } from './api/adminClient';
import { AlertCircle, Activity } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('omnitrix-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [activeTab, setActiveTab] = useState<'command_center' | 'complaints' | 'safety_signals'>('command_center');

  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaintItem | null>(null);
  const [session, setSession] = useState<OperatorSession | null>(() => {
    const saved = localStorage.getItem('omnitrix-session');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as Partial<OperatorSession>;
      if (!parsed.name || !parsed.authenticatedAt) return null;
      return { name: parsed.name, role: 'Safety Officer', authenticatedAt: parsed.authenticatedAt };
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Synchronize theme attribute on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omnitrix-theme', theme);
  }, [theme]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);

    try {
      const [sumData, compData] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminComplaints()
      ]);
      setSummary(sumData);
      setComplaints(compData);
      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      setGlobalError(err.message || 'Unable to load demo data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the local demo data automatically on mount
  useEffect(() => {
    if (!session) return;
    queueMicrotask(() => { void loadDashboardData(); });
  }, [session, loadDashboardData]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAuthenticated = (nextSession: OperatorSession) => {
    localStorage.setItem('omnitrix-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('omnitrix-session');
    setSession(null);
    setSummary(null);
    setComplaints([]);
    setSelectedComplaint(null);
  };

  if (!session) return <AuthGate onAuthenticated={handleAuthenticated} />;

  const handleStatusUpdated = (updatedId: string, newStatus: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.complaint_id === updatedId ? { ...c, status: newStatus } : c))
    );
    fetchAdminSummary().then(setSummary).catch(() => {});
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'command_center': return 'Command Center';
      case 'complaints': return 'Complaints Management';
      case 'safety_signals': return 'Safety Signals Analysis';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'command_center': return 'System-wide operational state and workspace health';
      case 'complaints': return 'Filter and inspect privacy-safe student complaint records';
      case 'safety_signals': return 'Real-time aggregate safety signals & language indicators';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        session={session}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <Header
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          onRefresh={loadDashboardData}
          loading={loading}
          session={session}
          lastSyncedAt={lastSyncedAt}
          isDemoMode={import.meta.env.VITE_API_MODE !== 'api'}
        />

        <main className="page-container">
          {globalError && (
            <div
              style={{
                backgroundColor: 'var(--accent-rose-light)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{globalError}</span>
              {globalError.toLowerCase().includes('authentication') && <button className="btn-secondary" onClick={handleLogout}>Sign in again</button>}
            </div>
          )}

          {activeTab === 'command_center' && (
            <CommandCenterTab
              summary={summary}
              complaints={complaints}
              onGoToComplaints={() => setActiveTab('complaints')}
              onGoToSignals={() => setActiveTab('safety_signals')}
              session={session}
              lastSyncedAt={lastSyncedAt}
              isDemoMode={import.meta.env.VITE_API_MODE !== 'api'}
            />
          )}

          {activeTab === 'complaints' && (
            <ComplaintsTab
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {activeTab === 'safety_signals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div className="dashboard-card">
                <div className="card-title-row">
                  <div className="card-title">
                    <Activity size={20} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Real-Time Safety Signals Breakdown</span>
                  </div>
                </div>
                <SafetyRadarMatrix complaints={complaints} />
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default App;
