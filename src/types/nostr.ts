/**
 * NostrSentinel AI - Data Types
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RelayConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DEGRADED' | 'OFFLINE';

export interface ThreatAnalysisResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  confidence: number; // 0 - 100
  categories: string[];
  signals: string[];
  explanation: string;
  recommendedAction: string;
  analyzedAt: string;
  engineUsed: 'gemini-ai' | 'sentinel-heuristics';
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
  relaySource?: string;
}

export interface AnalyzedEventRecord {
  id: string; // analysis record id
  nostrEventId?: string;
  content: string;
  authorPubkey?: string;
  relaySource?: string;
  kind?: number;
  timestamp: number;
  result: ThreatAnalysisResult;
  isDemo?: boolean;
}

export interface RelayStatus {
  url: string;
  status: RelayConnectionStatus;
  latencyMs?: number;
  read: boolean;
  write: boolean;
  lastChecked?: string;
  lastSuccessfulCommunication?: string;
  error?: string;
}

export interface SecurityDashboardStats {
  totalAnalyzed: number;
  threatsDetected: number; // HIGH + CRITICAL
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  threatDetectionRate: number; // percentage
  averageRiskScore: number;
  relaysConnectedCount: number;
  totalRelaysCount: number;
}

