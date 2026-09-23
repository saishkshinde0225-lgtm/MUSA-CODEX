import React from 'react';
import { Shield, LayoutDashboard, FileText, Activity, Sun, Moon, Lock, UserCheck, ChevronRight } from 'lucide-react';
import type { OperatorSession } from '../types/admin';

interface SidebarProps {
  activeTab: 'command_center' | 'complaints' | 'safety_signals';
  setActiveTab: (tab: 'command_center' | 'complaints' | 'safety_signals') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  session: OperatorSession;
  onLogout: () => void;
}

const navigation = [
  { id: 'command_center' as const, label: 'Command Center', note: 'System state', icon: LayoutDashboard },
  { id: 'complaints' as const, label: 'Complaints', note: 'Case register', icon: FileText },
  { id: 'safety_signals' as const, label: 'Safety Signals', note: 'Pattern watch', icon: Activity }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, onToggleTheme, session, onLogout }) => (
  <aside className="sidebar">
    <div className="brand-container">
      <div className="brand-badge"><Shield size={22} /></div>
      <div><div className="brand-title">OMNITRIX</div><div className="brand-subtitle">Safety intelligence / 01</div></div>
    </div>

    <div className="rail-caption">Workspace</div>
    <nav aria-label="Primary navigation">
      <ul className="nav-list">
        {navigation.map(({ id, label, note, icon: Icon }) => (
          <li key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={17} /><span><strong>{label}</strong><small>{note}</small></span><ChevronRight size={14} className="nav-arrow" />
          </li>
        ))}
      </ul>
    </nav>

    <div className="sidebar-footer">
      <div className="rail-caption">Operator session</div>
      <div className="operator-line"><UserCheck size={16} /><span><strong>{session.name}</strong><small>{session.role} / session active</small></span></div>
      <div className="guard-line"><Lock size={14} /><span>Zero-PII Guard Active</span></div>
      <div className="session-status"><span className="status-beacon" /> Session authenticated</div>
      <button onClick={onLogout} className="logout-button">Log out</button>
      <button onClick={onToggleTheme} className="theme-toggle-btn">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === 'dark' ? 'Light field' : 'Dark field'}</span>
      </button>
    </div>
  </aside>
);
