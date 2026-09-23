import React, { useState, useEffect, useCallback } from 'react';
import type { AdminComplaintItem, AdminComplaintDetailItem, ComplaintStatus, StatusHistoryItem } from '../types/admin';
import { updateComplaintStatus, fetchComplaintHistory, fetchAdminComplaintDetail } from '../api/adminClient';
import { X, ShieldAlert, History, Activity, CheckCircle2, Lock, ArrowRight, FileText } from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: AdminComplaintItem;
  onClose: () => void;
  onStatusUpdated: (updatedId: string, newStatus: ComplaintStatus) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onStatusUpdated
}) => {
  const [detail, setDetail] = useState<AdminComplaintDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [authorizedReview, setAuthorizedReview] = useState(false);

  const [currentStatus, setCurrentStatus] = useState<ComplaintStatus>(complaint.status);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetchComplaintHistory(complaint.complaint_id);
      setHistory(res.history || []);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load status history timeline');
    } finally {
      setHistoryLoading(false);
    }
  }, [complaint.complaint_id]);

  useEffect(() => {
    queueMicrotask(() => { void loadHistory(); });
  }, [loadHistory]);

  const handleAuthorizedReview = () => {
    setAuthorizedReview(true);
    loadCaseDetail();
  };

  const loadCaseDetail = async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await fetchAdminComplaintDetail(complaint.complaint_id);
      setDetail(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to retrieve original complaint details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!nextStatus || selectedStatus !== nextStatus) return;

    setUpdating(true);
    setUpdateMsg(null);

    try {
      await updateComplaintStatus(complaint.complaint_id, selectedStatus);
      setCurrentStatus(selectedStatus);
      setUpdateMsg({
        type: 'success',
        text: `Status updated to "${selectedStatus.replace('_', ' ').toUpperCase()}"`
      });
      onStatusUpdated(complaint.complaint_id, selectedStatus);
      loadHistory();
    } catch (err: any) {
      setUpdateMsg({
        type: 'error',
        text: err.message || 'Failed to update complaint status.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const preliminary_risk = detail?.preliminary_risk || complaint.preliminary_risk;
  const safe_representation = detail?.safe_representation || complaint.safe_representation;
  const risk_signals = detail?.risk_signals || complaint.risk_signals;
  const sarcasm_signals = detail?.sarcasm_signals || complaint.sarcasm_signals;

  const statuses: ComplaintStatus[] = ['new', 'in_review', 'resolved', 'closed'];
  const nextStatus = statuses[statuses.indexOf(currentStatus) + 1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Safety Case Inspection
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {complaint.complaint_id}
            </h2>
          </div>
          <button className="btn-secondary" style={{ padding: '0.35rem 0.55rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="case-summary-card">
            <div className="privacy-view-heading"><div><span className="section-kicker">Privacy-safe analysis</span><h3>Case context</h3></div><span className={`badge badge-status-${currentStatus}`}>{currentStatus.replace('_', ' ')}</span></div>
            <div className="case-summary-grid">
              <div><span>Risk</span><strong className={`badge badge-risk-${preliminary_risk.risk_level}`}>{preliminary_risk.risk_level} / {preliminary_risk.risk_score}</strong></div>
              <div><span>Category</span><strong>{complaint.category || 'Not provided'}</strong></div>
              <div><span>Urgency</span><strong>{complaint.student_reported_urgency || 'Not provided'}</strong></div>
              <div><span>Location zone</span><strong>{complaint.location_zone || 'Not provided'}</strong></div>
              <div><span>Timeframe</span><strong>{complaint.timeframe || complaint.created_at || 'Not provided'}</strong></div>
              <div><span>Desired action</span><strong>{complaint.desired_action || 'Not provided'}</strong></div>
            </div>
            <div className="authorized-review-row"><div><strong>Authorized review</strong><small>Protected narrative is withheld from the privacy-safe view.</small></div><button className="btn-secondary" onClick={handleAuthorizedReview} disabled={authorizedReview || detailLoading}><Lock size={14} /> {authorizedReview ? 'Review enabled' : 'Authorize review'}</button></div>
            {authorizedReview && <div className="protected-narrative"><div className="protected-narrative-title"><FileText size={16} /> Protected narrative</div>{detailLoading ? <span>Loading authorized detail...</span> : detailError ? <span className="auth-error">{detailError}</span> : <p>{detail?.privacy_safe_text || 'Original complaint unavailable for this case.'}</p>}</div>}
          </div>

          {/* Privacy Disclaimer Banner */}
          <div className="disclaimer-banner">
            <ShieldAlert size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>PRIVACY MODEL GUARANTEE:</strong> Student identity and identifying metadata are protected, while complaint content is accessible only to authenticated administrators for case review.
            </div>
          </div>

          {/* Preliminary Risk Evaluation Card */}
          <div className="dashboard-card">
            <div className="card-title-row">
              <div className="card-title">
                <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>PRELIMINARY RISK</span>
              </div>
              <span className={`badge badge-risk-${preliminary_risk.risk_level}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                {preliminary_risk.risk_level} Risk
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Internal deterministic heuristic — not a diagnosis or probability.
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  <span>Risk Score Intensity</span>
                  <span>{preliminary_risk.risk_score} / 100</span>
                </div>
                <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${preliminary_risk.risk_score}%`,
                      height: '100%',
                      background: preliminary_risk.risk_level === 'critical' ? 'var(--accent-rose)' :
                        preliminary_risk.risk_level === 'high' ? '#f97316' : 'var(--accent-emerald)'
                    }}
                  />
                </div>
              </div>
            </div>

            {preliminary_risk.reasons && preliminary_risk.reasons.length > 0 && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Detected Risk Factors:
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {preliminary_risk.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Safety Signals Card */}
          <div className="dashboard-card">
            <div className="card-title-row">
              <div className="card-title">
                <Lock size={18} style={{ color: 'var(--accent-purple)' }} />
                <span>SAFETY SIGNALS</span>
              </div>
            </div>

            <div className="grid-2">
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Text Representation</h4>
                <div className="key-value-grid">
                  <span className="key-label">Language:</span>
                  <span className="key-val" style={{ textTransform: 'capitalize' }}>{safe_representation?.language_hint || 'N/A'}</span>
                  <span className="key-label">Token Count:</span>
                  <span className="key-val">{safe_representation?.token_count ?? 'N/A'}</span>
                  <span className="key-label">Char Count:</span>
                  <span className="key-val">{safe_representation?.character_count ?? 'N/A'}</span>
                  <span className="key-label">Exclamation:</span>
                  <span className="key-val">{safe_representation?.has_exclamation ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Safety Indicators</h4>
                <div className="key-value-grid">
                  <span className="key-label">Distress Keywords:</span>
                  <span className="key-val">{risk_signals?.distress_keyword_count ?? 0}</span>
                  <span className="key-label">Threat Keywords:</span>
                  <span className="key-val">{risk_signals?.threat_keyword_count ?? 0}</span>
                  <span className="key-label">Help-Seeking:</span>
                  <span className="key-val">{risk_signals?.has_help_seeking ? 'Detected' : 'None'}</span>
                  <span className="key-label">Sarcasm/Coded:</span>
                  <span className="key-val">{sarcasm_signals?.has_sarcasm_markers ? 'Detected' : 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Workflow Indicator & Controller */}
          <div className="dashboard-card">
            <div className="card-title-row">
              <div className="card-title">
                <CheckCircle2 size={18} style={{ color: 'var(--accent-amber)' }} />
                <span>CASE STATUS WORKFLOW</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {statuses.map((st, idx) => {
                const isActive = st === currentStatus;
                const isPassed = statuses.indexOf(currentStatus) >= idx;
                return (
                  <React.Fragment key={st}>
                    <div
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isActive ? 'var(--accent-blue)' : isPassed ? 'var(--accent-blue-light)' : 'var(--bg-card-hover)',
                        color: isActive ? '#ffffff' : isPassed ? 'var(--accent-blue)' : 'var(--text-muted)',
                        border: isActive ? 'none' : '1px solid var(--border-color)'
                      }}
                    >
                      {st.replace('_', ' ')}
                    </div>
                    {idx < statuses.length - 1 && (
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {updateMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: updateMsg.type === 'success' ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)',
                  color: updateMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: `1px solid ${updateMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`
                }}
              >
                {updateMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                style={{ width: 'auto', minWidth: '200px' }}
                disabled={updating}
              >
                <option value={currentStatus}>{currentStatus.replace('_', ' ')}</option>
                {nextStatus && <option value={nextStatus}>{nextStatus.replace('_', ' ')}</option>}
              </select>

              <button
                className="btn-primary"
                onClick={handleStatusChange}
                disabled={updating || !nextStatus || selectedStatus !== nextStatus}
              >
                {updating ? 'Updating...' : nextStatus ? 'Update Status' : 'Case closed'}
              </button>
            </div>
          </div>

          {/* Case History Timeline */}
          <div className="dashboard-card">
            <div className="card-title-row">
              <div className="card-title">
                <History size={18} style={{ color: 'var(--accent-blue)' }} />
                <span>CASE HISTORY</span>
              </div>
            </div>

            {historyLoading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading history timeline...</div>
            ) : historyError ? (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{historyError}</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No previous status changes recorded.</div>
            ) : (
              <div className="timeline">
                {history.map((h) => (
                  <div key={h.history_id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div>
                        Status transition: <span style={{ color: 'var(--text-muted)' }}>{h.previous_status || 'Initial'}</span> → <strong style={{ textTransform: 'uppercase' }}>{h.new_status}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {h.changed_at}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



