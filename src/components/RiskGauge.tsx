import React from 'react';
import { RiskLevel } from '../types/nostr.ts';

interface RiskGaugeProps {
  score: number; // 0 - 100
  level: RiskLevel;
  confidence?: number;
  engineUsed?: 'gemini-ai' | 'sentinel-heuristics';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  confidence,
  engineUsed,
}) => {
  // Semi-circle SVG gauge calculation
  const radius = 64;
  const stroke = 9;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Circumference of semi-circle arc (pi * radius)
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  const getColor = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          stroke: '#f43f5e',
          text: 'text-rose-400',
          bgRing: 'stroke-rose-950/40',
          glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        };
      case 'HIGH':
        return {
          stroke: '#f97316',
          text: 'text-orange-400',
          bgRing: 'stroke-orange-950/40',
          glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.35)]',
        };
      case 'MEDIUM':
        return {
          stroke: '#f59e0b',
          text: 'text-amber-400',
          bgRing: 'stroke-amber-950/40',
          glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        };
      case 'LOW':
      default:
        return {
          stroke: '#10b981',
          text: 'text-emerald-400',
          bgRing: 'stroke-emerald-950/40',
          glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        };
    }
  };

  const colors = getColor();

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#0a0e17] border border-slate-800/80 rounded-2xl relative overflow-hidden shadow-inner">
      {/* Background technical corner tick marks */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-slate-700/60" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-700/60" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-700/60" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-slate-700/60" />

      {/* Semi-circular gauge container */}
      <div className="relative w-44 h-28 flex items-end justify-center overflow-hidden">
        <svg
          className="w-44 h-44 -rotate-180 transform"
          viewBox="0 0 160 160"
        >
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            className={colors.bgRing}
            strokeWidth={stroke}
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Active value track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${colors.glow}`}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {normalizedScore}
            <span className="text-xs text-slate-500 font-normal ml-0.5">/100</span>
          </span>
          <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${colors.text}`}>
            {level} RISK
          </span>
        </div>
      </div>

      {/* Meta indicators: Confidence & Engine */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">ENGINE:</span>
          <span className="text-slate-300 font-medium">
            {engineUsed === 'gemini-ai' ? 'Gemini 2.5 Flash' : 'Sentinel Heuristics'}
          </span>
        </div>
        {confidence !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">CONFIDENCE:</span>
            <span className="text-cyan-400 font-semibold">{confidence}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
