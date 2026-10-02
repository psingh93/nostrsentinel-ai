import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AnalyzedEventRecord,
  RelayStatus,
  SecurityDashboardStats,
  ThreatAnalysisResult,
  NostrEvent,
} from '../types/nostr.ts';
import {
  fetchRelayStatusesApi,
  retrySingleRelayApi,
  checkServerHealthApi,
  SAMPLE_SECURITY_SCENARIOS,
} from '../services/apiClient.ts';
import { runHeuristicAnalysis } from '../server/gemini.ts';

interface SecurityContextType {
  records: AnalyzedEventRecord[];
  addRecord: (record: AnalyzedEventRecord) => void;
  clearRecords: () => void;
  stats: SecurityDashboardStats;
  relays: RelayStatus[];
  isRelaysLoading: boolean;
  refreshRelays: () => Promise<void>;
  retryRelay: (url: string) => Promise<void>;
  customRelays: string[];
  setCustomRelays: (relays: string[]) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  seedDemoSamples: () => void;
  aiEngineStatus: 'Ready' | 'Configuration Required';
  nostrNetworkStatus: 'Connected' | 'Degraded' | 'Offline';
  securityMonitorStatus: 'Active' | 'Waiting';
  geminiConfigured: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const INITIAL_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://relay.snort.social',
  'wss://offchain.pub',
];

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AnalyzedEventRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nostrsentinel_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [customRelays, setCustomRelaysState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nostrsentinel_custom_relays');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RELAYS;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [relays, setRelays] = useState<RelayStatus[]>([]);
  const [isRelaysLoading, setIsRelaysLoading] = useState<boolean>(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  // Sync records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nostrsentinel_records', JSON.stringify(records));
    } catch {}
  }, [records]);

  // Sync custom relays
  const setCustomRelays = (newRelays: string[]) => {
    setCustomRelaysState(newRelays);
    try {
      localStorage.setItem('nostrsentinel_custom_relays', JSON.stringify(newRelays));
    } catch {}
  };

  const refreshRelays = async () => {
    setIsRelaysLoading(true);
    try {
      const fetched = await fetchRelayStatusesApi(customRelays);
      setRelays(fetched);
    } catch (e) {
      // In case of complete network unavailability, mark accurately as OFFLINE
      setRelays(
        customRelays.map(url => ({
          url,
          status: 'OFFLINE',
          latencyMs: undefined,
          read: false,
          write: false,
          lastChecked: new Date().toISOString(),
          error: 'Network connectivity unavailable',
        }))
      );
    } finally {
      setIsRelaysLoading(false);
    }
  };

  const retryRelay = async (url: string) => {
    // Set relay to CONNECTING state temporarily
    setRelays(prev =>
      prev.map(r => (r.url === url ? { ...r, status: 'CONNECTING', error: undefined } : r))
    );
    try {
      const updated = await retrySingleRelayApi(url);
      setRelays(prev => prev.map(r => (r.url === url ? updated : r)));
    } catch (err: any) {
      setRelays(prev =>
        prev.map(r =>
          r.url === url
            ? {
                ...r,
                status: 'OFFLINE',
                error: err?.message || 'Handshake failed',
                lastChecked: new Date().toISOString(),
              }
            : r
        )
      );
    }
  };

  // Check backend server health for true Gemini API status
  const checkHealth = async () => {
    try {
      const health = await checkServerHealthApi();
      setGeminiConfigured(health.geminiConfigured);
    } catch {
      setGeminiConfigured(false);
    }
  };

  useEffect(() => {
    refreshRelays();
    checkHealth();
    const interval = setInterval(() => {
      refreshRelays();
      checkHealth();
    }, 45000); // 45s periodic telemetry refresh
    return () => clearInterval(interval);
  }, [customRelays]);

  // Derived real states strictly from live application data
  const connectedRelaysCount = relays.filter(r => r.status === 'CONNECTED').length;
  const degradedRelaysCount = relays.filter(r => r.status === 'DEGRADED').length;

  let nostrNetworkStatus: 'Connected' | 'Degraded' | 'Offline' = 'Offline';
  if (connectedRelaysCount > 0 && degradedRelaysCount === 0 && relays.every(r => r.status !== 'OFFLINE')) {
    nostrNetworkStatus = 'Connected';
  } else if (connectedRelaysCount > 0 || degradedRelaysCount > 0) {
    nostrNetworkStatus = 'Degraded';
  } else {
    nostrNetworkStatus = 'Offline';
  }

  const aiEngineStatus: 'Ready' | 'Configuration Required' = geminiConfigured
    ? 'Ready'
    : 'Configuration Required';

  const securityMonitorStatus: 'Active' | 'Waiting' = records.length > 0 ? 'Active' : 'Waiting';

  // Compute live dashboard stats strictly from actual analyzed records
  const stats: SecurityDashboardStats = React.useMemo(() => {
    const total = records.length;
    let low = 0;
    let med = 0;
    let high = 0;
    let crit = 0;
    let totalScore = 0;

    for (const r of records) {
      const lvl = r.result.riskLevel;
      if (lvl === 'CRITICAL') crit++;
      else if (lvl === 'HIGH') high++;
      else if (lvl === 'MEDIUM') med++;
      else low++;

      totalScore += r.result.riskScore;
    }

    const threatsDetected = high + crit;
    const threatRate = total > 0 ? Math.round((threatsDetected / total) * 100) : 0;
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

    return {
      totalAnalyzed: total,
      threatsDetected,
      lowRiskCount: low,
      mediumRiskCount: med,
      highRiskCount: high,
      criticalRiskCount: crit,
      threatDetectionRate: threatRate,
      averageRiskScore: avgScore,
      relaysConnectedCount: connectedRelaysCount,
      totalRelaysCount: relays.length || customRelays.length,
    };
  }, [records, relays, customRelays, connectedRelaysCount]);

  const addRecord = (record: AnalyzedEventRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const clearRecords = () => {
    setRecords([]);
    try {
      localStorage.removeItem('nostrsentinel_records');
    } catch {}
  };

  // Pre-seed sample scenarios for evaluation if explicitly chosen by user
  const seedDemoSamples = () => {
    const sampleRecords: AnalyzedEventRecord[] = SAMPLE_SECURITY_SCENARIOS.map((scenario, idx) => {
      const analysis = runHeuristicAnalysis(scenario.content, { author: scenario.author });
      return {
        id: `benchmark-${idx + 1}-${Date.now()}`,
        nostrEventId: `4f9e8a${idx}2b9101c43d89fe87123aa1259ab8f0012480112448a${idx}eef4098711`,
        authorPubkey: scenario.author,
        content: scenario.content,
        kind: 1,
        timestamp: Date.now() - (idx * 3600000 + 120000),
        result: analysis,
        isDemo: true,
        relaySource: 'wss://relay.damus.io',
      };
    });

    setRecords(prev => [...sampleRecords, ...prev]);
  };

  return (
    <SecurityContext.Provider
      value={{
        records,
        addRecord,
        clearRecords,
        stats,
        relays,
        isRelaysLoading,
        refreshRelays,
        retryRelay,
        customRelays,
        setCustomRelays,
        isDemoMode,
        setIsDemoMode,
        seedDemoSamples,
        aiEngineStatus,
        nostrNetworkStatus,
        securityMonitorStatus,
        geminiConfigured,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
