export type Role = 'Nurse' | 'Charge Nurse' | 'Admin';

export interface User {
  id: number;
  username: string;
  role: Role;
  name: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  room: string;
  diagnosis: string;
  allergies: string;
  risk_flags: string[];
}

export interface VitalRecord {
  id: number;
  patient_id: string;
  temp: number;
  hr: number;
  rr: number;
  bp_sys: number;
  bp_dia: number;
  spo2: number;
  timestamp: string;
  is_auto: number;
}

export interface Alert {
  id: number;
  patient_id: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  suggestions: string[];
  status: 'pending' | 'acknowledged';
  is_ai: number;
  timestamp: string;
}

export interface Note {
  id: number;
  patient_id: string;
  content: string;
  original_ai_content: string | null;
  nurse_id: string;
  status: 'draft' | 'approved';
  timestamp: string;
}

export interface IOEntry {
  id: number;
  patient_id: string;
  type: 'intake' | 'output';
  source: string;
  volume: number;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
}
