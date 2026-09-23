import React, { useState } from 'react';
import type { AdminComplaintItem } from '../types/admin';
import { Search, Lock, ExternalLink, Copy, Check, SlidersHorizontal } from 'lucide-react';

interface ComplaintsTabProps { complaints: AdminComplaintItem[]; onSelectComplaint: (complaint: AdminComplaintItem) => void; }

export const ComplaintsTab: React.FC<ComplaintsTabProps> = ({ complaints, onSelectComplaint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyId = (id: string, e: React.MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const categories = Array.from(new Set(complaints.map((item) => item.category).filter(Boolean))) as string[];
  const filteredComplaints = complaints.filter((item) => {
    const createdDate = item.created_at?.slice(0, 10) || '';
    return item.complaint_id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || item.status === statusFilter) &&
      (riskFilter === 'all' || item.preliminary_risk.risk_level === riskFilter) &&
      (categoryFilter === 'all' || item.category === categoryFilter) &&
      (!fromDate || createdDate >= fromDate) && (!toDate || createdDate <= toDate);
  });

  return <div className="register-layout">
    <section className="register-intro"><div><span className="section-kicker">Case register / {filteredComplaints.length.toString().padStart(2, '0')} shown</span><h2>Complaints management</h2><p>Filter and inspect privacy-safe student complaint records</p></div><div className="privacy-stamp"><Lock size={14} /><span>Privacy engine active</span></div></section>
    <div className="privacy-note"><Lock size={15} /><span><strong>Privacy Engine Active:</strong> All listed complaint data consists of analytical signals and privacy-safe metadata. Raw narrative text, student identities, roll numbers, and device telemetry are omitted by design.</span></div>
    <section className="filter-dock"><div className="register-search"><Search size={16} /><input type="text" placeholder="Filter by Complaint ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><div className="filter-label"><SlidersHorizontal size={15} /> Filters</div><select aria-label="Filter by status" className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option value="new">New</option><option value="in_review">In Review</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><select aria-label="Filter by risk" className="form-input" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}><option value="all">All Risk Levels</option><option value="low">Low Risk</option><option value="medium">Medium Risk</option><option value="high">High Risk</option><option value="critical">Critical Risk</option></select><select aria-label="Filter by category" className="form-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">All Categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><label className="date-filter">From<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label><label className="date-filter">To<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label></section>
    <section className="case-list"><div className="case-list-head"><span>Case / status</span><span>Risk assessment</span><span>Signals</span><span>Created</span><span /></div>{filteredComplaints.length === 0 ? <div className="empty-state">No complaints match the current filter criteria.</div> : filteredComplaints.map((item) => <div className="case-row" role="button" tabIndex={0} key={item.complaint_id} onClick={() => onSelectComplaint(item)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectComplaint(item); }}><div className="case-primary"><span className="case-id">{item.complaint_id}</span><span className={`badge badge-status-${item.status}`}>{item.status.replace('_', ' ')}</span><button className="copy-button" onClick={(e) => handleCopyId(item.complaint_id, e)} title="Copy Complaint ID">{copiedId === item.complaint_id ? <Check size={13} /> : <Copy size={13} />}</button></div><div className="case-risk"><span className={`badge badge-risk-${item.preliminary_risk.risk_level}`}>{item.preliminary_risk.risk_level}</span><div className="score-bar"><i style={{ width: `${item.preliminary_risk.risk_score}%` }} /></div><strong>{item.preliminary_risk.risk_score}<small>/100</small></strong></div><div className="case-signals"><span>{item.risk_signals?.distress_keyword_count ?? 0} distress</span><span>{item.risk_signals?.threat_keyword_count ?? 0} threat</span><span>{item.safe_representation?.language_hint || 'N/A'}</span></div><time>{item.created_at || 'N/A'}</time><span className="inspect-action">Inspect <ExternalLink size={13} /></span></div>)}</section>
  </div>;
};
