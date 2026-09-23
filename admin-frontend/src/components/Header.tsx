import React from 'react';
import { RefreshCw, FlaskConical, Command } from 'lucide-react';
import type { OperatorSession } from '../types/admin';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  loading: boolean;
  session: OperatorSession;
  lastSyncedAt: string | null;
  isDemoMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh, loading, session, lastSyncedAt, isDemoMode }) => (
  <header className="top-bar">
    <div className="location-line"><span className="eyebrow"><Command size={12} /> Operations / {title}</span><span className="date-stamp">22 SEP 2026</span></div>
    <div className="header-mainline">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="header-actions">
        <span className="operator-chip">{session.name} / {session.role}</span>
        {isDemoMode && <span className="demo-mark"><FlaskConical size={14} /> Demo workspace</span>}
        <span className="sync-mark">Synced {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'pending'}</span>
        <button onClick={onRefresh} className="refresh-button" disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button>
      </div>
    </div>
  </header>
);
