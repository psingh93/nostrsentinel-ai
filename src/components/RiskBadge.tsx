import React from 'react';
import { RiskLevel } from '../types/nostr.ts';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showScore = true,
}) => {
  const getStyles = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-[#220d12] border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.18)]',
          badge: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'HIGH':
        return {
          bg: 'bg-[#21120a] border-orange-500/40 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
          badge: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-[#1e1709] border-amber-500/40 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-[#0a1813] border-emerald-500/40 text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
    }
  };

  const styles = getStyles();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-mono',
    md: 'text-xs px-2.5 py-1 gap-2 font-mono font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-mono font-semibold',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-lg border backdrop-blur-md transition-all ${styles.bg} ${sizeClasses}`}
    >
      {styles.icon}
      <span className="tracking-wider uppercase font-semibold">{level} RISK</span>
      {showScore !== false && score !== undefined && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded font-mono text-[11px] border ${styles.badge}`}
        >
          {score}/100
        </span>
      )}
    </div>
  );
};
