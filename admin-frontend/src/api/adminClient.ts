import type {
  AdminSummaryResponse,
  AdminComplaintItem,
  AdminComplaintDetailItem,
  ComplaintStatus,
  ComplaintHistoryResponse,
  StatusHistoryItem
} from '../types/admin';

const API_MODE = import.meta.env.VITE_API_MODE || 'demo';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const mockComplaints: AdminComplaintItem[] = [
  {
    complaint_id: 'OMN-2024-001', status: 'new', created_at: '2026-09-22T09:24:00Z',
    category: 'Safety concern', location_zone: 'North campus', timeframe: 'Today, 09:24', student_reported_urgency: 'High', desired_action: 'Immediate review and guidance',
    preliminary_risk: { risk_level: 'critical', risk_score: 91, reasons: ['Urgent language detected', 'Threat signal detected'] },
    safe_representation: { language_hint: 'English', token_count: 42, character_count: 218, has_question: true, has_exclamation: true },
    risk_signals: { distress_keyword_count: 4, threat_keyword_count: 2, urgency_keyword_count: 3, help_seeking_count: 1, negative_emotion_count: 3, has_threat_language: true, has_help_seeking: true, has_urgent_language: true },
    sarcasm_signals: { sarcasm_marker_count: 0, coded_language_marker_count: 1, indirect_distress_marker_count: 0, has_coded_language_markers: true }
  },
  {
    complaint_id: 'OMN-2024-002', status: 'in_review', created_at: '2026-09-21T16:10:00Z',
    category: 'Wellbeing support', location_zone: 'Residential zone', timeframe: '21 Sep, 16:10', student_reported_urgency: 'High', desired_action: 'Contact the appropriate support team',
    preliminary_risk: { risk_level: 'high', risk_score: 74, reasons: ['Distress language detected', 'Help-seeking language detected'] },
    safe_representation: { language_hint: 'English', token_count: 58, character_count: 302 },
    risk_signals: { distress_keyword_count: 5, threat_keyword_count: 0, urgency_keyword_count: 2, help_seeking_count: 2, negative_emotion_count: 4, has_help_seeking: true, has_urgent_language: true },
    sarcasm_signals: { sarcasm_marker_count: 1, coded_language_marker_count: 0, indirect_distress_marker_count: 1, has_sarcasm_markers: true, has_indirect_distress: true }
  },
  {
    complaint_id: 'OMN-2024-003', status: 'resolved', created_at: '2026-09-20T11:42:00Z',
    category: 'Incident report', location_zone: 'Academic block', timeframe: '20 Sep, 11:42', student_reported_urgency: 'Medium', desired_action: 'Keep a record for follow-up',
    preliminary_risk: { risk_level: 'medium', risk_score: 48, reasons: ['Negative emotion signal detected'] },
    safe_representation: { language_hint: 'English', token_count: 36, character_count: 179, has_question: true },
    risk_signals: { distress_keyword_count: 2, threat_keyword_count: 0, urgency_keyword_count: 0, help_seeking_count: 1, negative_emotion_count: 2, has_help_seeking: true },
    sarcasm_signals: { sarcasm_marker_count: 0, coded_language_marker_count: 0, indirect_distress_marker_count: 0 }
  },
  {
    complaint_id: 'OMN-2024-004', status: 'closed', created_at: '2026-09-18T08:05:00Z',
    category: 'Process feedback', location_zone: 'Online submission', timeframe: '18 Sep, 08:05', student_reported_urgency: 'Low', desired_action: 'Record feedback',
    preliminary_risk: { risk_level: 'low', risk_score: 19, reasons: [] },
    safe_representation: { language_hint: 'English', token_count: 24, character_count: 121, has_question: true },
    risk_signals: { distress_keyword_count: 0, threat_keyword_count: 0, urgency_keyword_count: 0, help_seeking_count: 0, negative_emotion_count: 1 },
    sarcasm_signals: { sarcasm_marker_count: 0, coded_language_marker_count: 0, indirect_distress_marker_count: 0 }
  }
];

const mockStatusHistory: Record<string, StatusHistoryItem[]> = {};

const mockNarratives: Record<string, string> = {
  'OMN-2024-001': 'I need someone to review this situation urgently and help me understand what I should do next.',
  'OMN-2024-002': 'I have been struggling with this for a while and would like support from the appropriate team.',
  'OMN-2024-003': 'The issue has been addressed, but I wanted the incident recorded for future reference.',
  'OMN-2024-004': 'Sharing this feedback so the process can be improved for other students.'
};

const isDemoMode = API_MODE !== 'api';

function getMockSummary(): AdminSummaryResponse {
  return mockComplaints.reduce<AdminSummaryResponse>((summary, complaint) => {
    summary.total_complaints += 1;
    summary.status_counts[complaint.status] += 1;
    summary.risk_counts[complaint.preliminary_risk.risk_level] += 1;
    return summary;
  }, {
    total_complaints: 0,
    status_counts: { new: 0, in_review: 0, resolved: 0, closed: 0 },
    risk_counts: { low: 0, medium: 0, high: 0, critical: 0 }
  });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData && errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback message
    }

    if (res.status === 401) {
      throw new Error('Authentication required. Backend rejected request (401).');
    } else if (res.status === 403) {
      throw new Error('Access denied (403). Invalid Admin API Key.');
    } else if (res.status === 404) {
      throw new Error('Requested resource or complaint not found (404).');
    } else if (res.status >= 500) {
      throw new Error(`Backend server error (${res.status}): ${errorMsg}`);
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchAdminSummary(): Promise<AdminSummaryResponse> {
  if (isDemoMode) return getMockSummary();
  const res = await fetch(`${BASE_URL}/api/admin/summary`);
  return handleResponse<AdminSummaryResponse>(res);
}

export async function fetchAdminComplaints(): Promise<AdminComplaintItem[]> {
  if (isDemoMode) return mockComplaints;
  const res = await fetch(`${BASE_URL}/api/admin/complaints`);
  return handleResponse<AdminComplaintItem[]>(res);
}

export async function fetchAdminComplaintDetail(complaintId: string): Promise<AdminComplaintDetailItem> {
  if (isDemoMode) {
    const complaint = mockComplaints.find((item) => item.complaint_id === complaintId);
    if (!complaint) throw new Error('Requested complaint not found.');
    return { ...complaint, privacy_safe_text: mockNarratives[complaintId] || 'Original complaint unavailable for this case.' };
  }
  const res = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}`);
  return handleResponse<AdminComplaintDetailItem>(res);
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus
): Promise<{ complaint_id: string; status: ComplaintStatus }> {
  if (isDemoMode) {
    const complaint = mockComplaints.find((item) => item.complaint_id === complaintId);
    if (!complaint) throw new Error('Requested complaint not found.');
    const previousStatus = complaint.status;
    complaint.status = status;
    mockStatusHistory[complaintId] = [
      ...(mockStatusHistory[complaintId] || []),
      { history_id: Date.now(), previous_status: previousStatus, new_status: status, changed_at: new Date().toISOString() }
    ];
    return { complaint_id: complaintId, status };
  }
  const res = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  return handleResponse(res);
}

export async function fetchComplaintHistory(
  complaintId: string
): Promise<ComplaintHistoryResponse> {
  if (isDemoMode) {
    const complaint = mockComplaints.find((item) => item.complaint_id === complaintId);
    if (!complaint) throw new Error('Requested complaint not found.');
    return { complaint_id: complaintId, preliminary_risk: complaint.preliminary_risk, history: mockStatusHistory[complaintId] || [] };
  }
  const res = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/history`);
  return handleResponse<ComplaintHistoryResponse>(res);
}


