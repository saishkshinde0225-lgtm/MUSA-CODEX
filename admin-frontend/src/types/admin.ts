export type ComplaintStatus = 'new' | 'in_review' | 'resolved' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PreliminaryRisk {
  risk_level: RiskLevel;
  risk_score: number;
  reasons: string[];
}

export interface SafeRepresentation {
  language_hint?: string;
  token_count?: number;
  character_count?: number;
  has_question?: boolean;
  has_exclamation?: boolean;
  has_repeated_punctuation?: boolean;
}

export interface RiskSignals {
  distress_keyword_count?: number;
  threat_keyword_count?: number;
  urgency_keyword_count?: number;
  help_seeking_count?: number;
  negative_emotion_count?: number;
  has_threat_language?: boolean;
  has_help_seeking?: boolean;
  has_urgent_language?: boolean;
}

export interface SarcasmSignals {
  sarcasm_marker_count?: number;
  coded_language_marker_count?: number;
  indirect_distress_marker_count?: number;
  has_sarcasm_markers?: boolean;
  has_coded_language_markers?: boolean;
  has_indirect_distress?: boolean;
}

export interface AdminComplaintItem {
  complaint_id: string;
  status: ComplaintStatus;
  category?: string;
  location_zone?: string;
  timeframe?: string;
  student_reported_urgency?: string;
  desired_action?: string;
  safe_representation?: SafeRepresentation;
  risk_signals?: RiskSignals;
  sarcasm_signals?: SarcasmSignals;
  feature_summary?: Record<string, any>;
  preliminary_risk: PreliminaryRisk;
  created_at?: string;
}

export interface AdminComplaintDetailItem extends AdminComplaintItem {
  privacy_safe_text: string;
}

export interface StatusHistoryItem {
  history_id: number;
  previous_status: string;
  new_status: string;
  changed_at: string;
}

export interface OperatorSession {
  name: string;
  role: 'Safety Officer';
  authenticatedAt: string;
}

export interface ComplaintHistoryResponse {
  complaint_id: string;
  preliminary_risk: PreliminaryRisk;
  history: StatusHistoryItem[];
}

export interface AdminSummaryResponse {
  total_complaints: number;
  status_counts: {
    new: number;
    in_review: number;
    resolved: number;
    closed: number;
  };
  risk_counts: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}


