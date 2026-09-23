import React from 'react';
import type { AdminComplaintItem } from '../types/admin';
import { Activity, AlertTriangle, LifeBuoy, Zap, MessageSquareWarning } from 'lucide-react';

interface SafetyRadarMatrixProps { complaints: AdminComplaintItem[]; }
export const SafetyRadarMatrix: React.FC<SafetyRadarMatrixProps> = ({ complaints }) => {
  let totalHelpSeeking = 0, totalDistress = 0, totalThreats = 0, totalUrgency = 0, totalSarcasmCoded = 0;
  let helpReports = 0, distressReports = 0, threatReports = 0, urgencyReports = 0, codedReports = 0;
  complaints.forEach((c) => { const rs = c.risk_signals || {}; const ss = c.sarcasm_signals || {}; if (rs.has_help_seeking || (rs.help_seeking_count && rs.help_seeking_count > 0)) { helpReports++; totalHelpSeeking += rs.help_seeking_count || 1; } if (rs.distress_keyword_count && rs.distress_keyword_count > 0) { distressReports++; totalDistress += rs.distress_keyword_count; } if (rs.has_threat_language || (rs.threat_keyword_count && rs.threat_keyword_count > 0)) { threatReports++; totalThreats += rs.threat_keyword_count || 1; } if (rs.has_urgent_language || (rs.urgency_keyword_count && rs.urgency_keyword_count > 0)) { urgencyReports++; totalUrgency += rs.urgency_keyword_count || 1; } if (ss.has_sarcasm_markers || ss.has_coded_language_markers || ss.has_indirect_distress) { codedReports++; totalSarcasmCoded += (ss.sarcasm_marker_count || 0) + (ss.coded_language_marker_count || 0) + (ss.indirect_distress_marker_count || 0) || 1; } });
  const maxVal = Math.max(totalHelpSeeking, totalDistress, totalThreats, totalUrgency, totalSarcasmCoded, 1);
  const signalItems = [
    { label: 'Help-Seeking Indicators', count: totalHelpSeeking, reports: helpReports, color: 'var(--accent-blue)', icon: LifeBuoy, desc: 'Occurrences / affected reports' },
    { label: 'Distress Keyword Markers', count: totalDistress, reports: distressReports, color: 'var(--accent-cyan)', icon: Activity, desc: 'Occurrences / affected reports' },
    { label: 'Urgent Intervention Language', count: totalUrgency, reports: urgencyReports, color: 'var(--accent-amber)', icon: Zap, desc: 'Occurrences / affected reports' },
    { label: 'Threat & Harassment Signals', count: totalThreats, reports: threatReports, color: 'var(--accent-rose)', icon: AlertTriangle, desc: 'Occurrences / affected reports' },
    { label: 'Sarcasm & Coded Language', count: totalSarcasmCoded, reports: codedReports, color: 'var(--accent-purple)', icon: MessageSquareWarning, desc: 'Occurrences / affected reports' }
  ];
  return <section className="signal-watch"><div className="panel-heading"><div><span className="section-kicker">Pattern watch</span><h3>Safety signal analysis matrix</h3><p className="panel-description">Counts distinguish signal occurrences from affected reports.</p></div><span className="signal-status"><span /> Aggregate signals</span></div><div className="signal-list">{signalItems.map((item) => { const Icon = item.icon; return <div className="signal-row" key={item.label}><div className="signal-icon"><Icon size={16} style={{ color: item.color }} /></div><div className="signal-copy"><strong>{item.label}</strong><small>{item.desc}: {item.reports}</small></div><div className="signal-meter"><i style={{ width: `${Math.round((item.count / maxVal) * 100)}%`, background: item.color }} /></div><strong className="signal-count" style={{ color: item.color }}>{item.count}</strong></div>; })}</div></section>;
};
