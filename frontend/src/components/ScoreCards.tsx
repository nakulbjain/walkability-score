import React from 'react';
import { Footprints, MapPin, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { ScoringResult } from '../types';

interface ScoreCardsProps {
  scoring?: ScoringResult | null;
  onToggleBreakdown?: () => void;
  showBreakdown?: boolean;
}

export const ScoreCards: React.FC<ScoreCardsProps> = ({
  scoring,
  onToggleBreakdown,
  showBreakdown = false,
}) => {
  if (!scoring) return null;

  const getScoreColor = (score?: number | null) => {
    if (score == null) return { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400', ring: 'ring-slate-700' };
    if (score >= 90) return { bg: 'bg-emerald-950/40', border: 'border-emerald-600/40', text: 'text-emerald-400', ring: 'ring-emerald-500/20' };
    if (score >= 75) return { bg: 'bg-indigo-950/40', border: 'border-indigo-600/40', text: 'text-indigo-400', ring: 'ring-indigo-500/20' };
    if (score >= 60) return { bg: 'bg-amber-950/40', border: 'border-amber-600/40', text: 'text-amber-400', ring: 'ring-amber-500/20' };
    if (score >= 40) return { bg: 'bg-orange-950/40', border: 'border-orange-600/40', text: 'text-orange-400', ring: 'ring-orange-500/20' };
    return { bg: 'bg-rose-950/40', border: 'border-rose-600/40', text: 'text-rose-400', ring: 'ring-rose-500/20' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Partial Data
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Unavailable
          </span>
        );
    }
  };

  const walkColors = getScoreColor(scoring.walkabilityScore);
  const locColors = getScoreColor(scoring.locationScore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Walkability Score */}
        <div className={`rounded-2xl border ${walkColors.border} ${walkColors.bg} p-5 shadow-xl transition-all duration-200 relative overflow-hidden backdrop-blur-sm`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-md">
                <Footprints className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Walkability Score</h3>
                  {getStatusBadge(scoring.walkabilityStatus)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pedestrian accessibility across 8 neighborhood essentials
                </p>
              </div>
            </div>

            {/* Score Ring */}
            <div className="text-right shrink-0">
              {scoring.walkabilityScore != null ? (
                <div>
                  <div className={`text-3xl font-black ${walkColors.text} tracking-tight`}>
                    {Math.round(scoring.walkabilityScore)}
                    <span className="text-sm font-semibold text-slate-400">/100</span>
                  </div>
                  <span className={`text-xs font-bold ${walkColors.text} block mt-0.5`}>
                    {scoring.walkabilityRating}
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-400 block">Unavailable</span>
                  <span className="text-[10px] text-slate-500">Incomplete Routing</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <p className="text-xs text-slate-300 line-clamp-1 pr-2">
              {scoring.walkabilityExplanation || 'Walkability index computed across verified pedestrian routes.'}
            </p>
            {onToggleBreakdown && (
              <button
                type="button"
                onClick={onToggleBreakdown}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <span>{showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}</span>
                {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Property Location Score */}
        <div className={`rounded-2xl border ${locColors.border} ${locColors.bg} p-5 shadow-xl transition-all duration-200 relative overflow-hidden backdrop-blur-sm`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Property Location Score</h3>
                  {getStatusBadge(scoring.locationStatus)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Amenity-based location convenience score (9 categories)
                </p>
              </div>
            </div>

            {/* Score Ring */}
            <div className="text-right shrink-0">
              {scoring.locationScore != null ? (
                <div>
                  <div className={`text-3xl font-black ${locColors.text} tracking-tight`}>
                    {Math.round(scoring.locationScore)}
                    <span className="text-sm font-semibold text-slate-400">/100</span>
                  </div>
                  <span className={`text-xs font-bold ${locColors.text} block mt-0.5`}>
                    {scoring.locationRating}
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-400 block">Unavailable</span>
                  <span className="text-[10px] text-slate-500">Incomplete Routing</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <p className="text-xs text-slate-300 line-clamp-1 pr-2">
              {scoring.locationExplanation || 'Overall amenity convenience score based on proximity.'}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 shrink-0">
              <Info className="w-3 h-3 text-slate-400" />
              <span>v{scoring.algorithmVersion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

