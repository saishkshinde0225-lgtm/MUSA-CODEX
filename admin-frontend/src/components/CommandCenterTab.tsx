import React from 'react';
import type { AdminSummaryResponse, AdminComplaintItem } from '../types/admin';
import type { OperatorSession } from '../types/admin';
import { Activity, CheckCircle2, Database, Lock, Radio, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface CommandCenterTabProps {
  summary: AdminSummaryResponse | null;
  complaints: AdminComplaintItem[];
  onGoToComplaints: () => void;
  onGoToSignals: () => void;
  session: OperatorSession;
  lastSyncedAt: string | null;
  isDemoMode: boolean;
}

export const CommandCenterTab: React.FC<CommandCenterTabProps> = ({ summary, complaints, onGoToComplaints, onGoToSignals, session, lastSyncedAt, isDemoMode }) => {
  if (!summary) return <div className="loading-state">Preparing the Command Center...</div>;

  const unresolved = summary.status_counts.new + summary.status_counts.in_review;
  const requiringAttention = summary.risk_counts.high + summary.risk_counts.critical;
  const aggregateSignals = complaints.reduce((total, complaint) => {
    const risk = complaint.risk_signals || {};
    const sarcasm = complaint.sarcasm_signals || {};
    return total + (risk.distress_keyword_count || 0) + (risk.threat_keyword_count || 0) + (risk.urgency_keyword_count || 0) + (risk.help_seeking_count || 0) + (sarcasm.sarcasm_marker_count || 0) + (sarcasm.coded_language_marker_count || 0) + (sarcasm.indirect_distress_marker_count || 0);
  }, 0);

  return <div className="command-center">
    <section className="command-banner">
      <div><span className="section-kicker">OMNITRIX / system control</span><h2>Command Center</h2><p>System-wide operational state and workspace health</p></div>
      <div className="system-online"><span className="status-beacon" /><strong>System operational</strong><small>Last synchronized {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'pending'}</small></div>
    </section>

    <section className="state-band" aria-label="System state">
      <div className="state-cell"><span className="state-label"><Radio size={14} /> Runtime state</span><strong>Operational</strong><small>All demo services responding</small></div>
      <div className="state-cell"><span className="state-label"><Lock size={14} /> Privacy engine</span><strong>Zero-PII Guard Active</strong><small>Identity and metadata protected</small></div>
      <div className="state-cell"><span className="state-label"><Database size={14} /> Dataset</span><strong>{isDemoMode ? 'Demo workspace' : 'Connected backend'}</strong><small>{summary.total_complaints} reports available</small></div>
      <div className="state-cell"><span className="state-label"><CheckCircle2 size={14} /> Operator</span><strong>{session.role}</strong><small>{session.name} / session active</small></div>
    </section>

    <section className="workspace-health">
      <div className="health-heading"><div><span className="section-kicker">Workspace health</span><h3>Current system workload</h3></div><span className="health-note">Aggregate state only</span></div>
      <div className="health-reading"><strong>{unresolved.toString().padStart(2, '0')}</strong><span>unresolved<br />reports</span><div className="health-rule" /><strong>{requiringAttention.toString().padStart(2, '0')}</strong><span>requiring<br />attention</span><div className="health-rule" /><strong>{summary.status_counts.resolved + summary.status_counts.closed}</strong><span>completed<br />reports</span></div>
      <div className="health-footer"><span><Activity size={14} /> Current workload is {unresolved > 0 ? 'active' : 'clear'}</span><span>{summary.total_complaints} total reports in workspace</span></div>
    </section>

    <section className="section-status">
      <div className="section-status-heading"><div><span className="section-kicker">Workspace sections</span><h3>Where to work next</h3></div><span className="health-note">Navigate into detail when needed</span></div>
      <div className="section-status-grid">
        <button className="section-status-row" onClick={onGoToComplaints}><span className="section-status-icon complaints"><Activity size={18} /></span><span className="section-status-copy"><strong>Complaints</strong><small>Case records and management</small></span><span className="section-status-summary"><strong>{summary.total_complaints} reports</strong><small>{requiringAttention} require attention</small></span><ArrowUpRight size={17} /></button>
        <button className="section-status-row" onClick={onGoToSignals}><span className="section-status-icon signals"><ShieldCheck size={18} /></span><span className="section-status-copy"><strong>Safety Signals</strong><small>Pattern and language analysis</small></span><span className="section-status-summary"><strong>{aggregateSignals} aggregate signals</strong><small>Pattern monitoring active</small></span><ArrowUpRight size={17} /></button>
      </div>
    </section>

    <section className="system-footer-band"><span><Database size={14} /> Dataset: {isDemoMode ? 'local demo data' : 'backend data'}</span><span><Lock size={14} /> Privacy model: active</span><span><Radio size={14} /> Session: {session.role} / duty</span><span className="system-footer-state"><span className="status-beacon" /> Nominal</span></section>
  </div>;
};
