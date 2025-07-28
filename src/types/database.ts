
// Database types voor Supabase integratie
export interface Document {
  id: string;
  title: string;
  file_path?: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: 'nieuw' | 'in_behandeling' | 'wacht_op_info' | 'afgehandeld' | 'geannuleerd';
  priority: 'laag' | 'normaal' | 'hoog' | 'urgent';
  deadline?: Date;
  metadata: Record<string, unknown>;
  vector_embedding?: number[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  type?: string; // optioneel voor compatibiliteit
}

export interface ActivityLog {
  id: string;
  document_id: string;
  user_id: string;
  action: 'upload' | 'view' | 'edit' | 'delete' | 'restore' | 'status_change' | 'ai_query';
  details: Record<string, unknown>;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  scheduled_at?: Date;
  sent_at?: Date;
  created_at: Date;
}

export interface NotificationRule {
  id: string;
  trigger: 'deadline_approaching' | 'status_change' | 'new_document' | 'ai_insight';
  channels: ('email' | 'whatsapp' | 'sms' | 'in_app')[];
  timing: string;
  conditions: Record<string, unknown>;
  template: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentStatus {
  id: string;
  status: 'nieuw' | 'in_behandeling' | 'wacht_op_info' | 'afgehandeld' | 'geannuleerd';
  priority: 'laag' | 'normaal' | 'hoog' | 'urgent';
  deadline?: Date;
  assigned_to?: string;
  follow_up_date?: Date;
  notes: string[];
  created_at: Date;
  updated_at: Date;
}

export interface AIInsight {
  id: string;
  document_id: string;
  insight_type: 'summary' | 'keywords' | 'sentiment' | 'deadline' | 'cross_reference';
  data: Record<string, unknown>;
  confidence_score: number;
  created_at: Date;
}

export interface SearchQuery {
  id: string;
  user_id: string;
  query: string;
  query_type: 'semantic' | 'keyword';
  results_count: number;
  processing_time: number;
  created_at: Date;
}
