import React, { useState } from 'react';
import { BarChart3, Info, Footprints, MapPin, X } from 'lucide-react';
import type { AmenityCategory, ScoringResult, CategoryScoreDetail } from '../types';

interface ScoringVisualizationProps {
  scoring: ScoringResult;
}

const CATEGORY_NAMES: Record<AmenityCategory, string> = {
  GROCERY: 'Daily Essentials',
  TRANSPORTATION: 'Transportation',
  DINING: 'Food & Dining',
  HEALTHCARE: 'Healthcare',
  PARK: 'Parks & Recreation',
  FITNESS: 'Fitness',
  EDUCATION: 'Education',
  BANKING: 'Banking & Services',
  ENTERTAINMENT: 'Entertainment',
};

export const ScoringVisualization: React.FC<ScoringVisualizationProps> = ({ scoring }) => {
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const categories = Object.keys(scoring.categoryScores) as AmenityCategory[];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Scoring Comparison & Category Distribution</h3>
            <p className="text-xs text-slate-400">Horizontal visual comparison between Walkability and Property Location convenience</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>How It's Scored</span>
        </button>
      </div>

      {/* Comparative Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-indigo-400" />
              Overall Walkability Index
            </span>
            <span className="font-extrabold text-indigo-400">
              {scoring.walkabilityScore != null ? `${Math.round(scoring.walkabilityScore)}/100` : 'Unavailable'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, scoring.walkabilityScore || 0))}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Overall Property Location Score
            </span>
            <span className="font-extrabold text-emerald-400">
              {scoring.locationScore != null ? `${Math.round(scoring.locationScore)}/100` : 'Unavailable'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, scoring.locationScore || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Horizontal Bars */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category Accessibility Index</h4>
        <div className="space-y-2.5">
          {categories.map((cat) => {
            const detail = scoring.categoryScores[cat] as CategoryScoreDetail;
            const score = detail.categoryScore != null ? detail.categoryScore : 0;
            const name = CATEGORY_NAMES[cat] || detail.categoryName;

            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[180px] sm:max-w-xs">{name}</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-400">
                      {detail.usedInScoringCount} best used
                    </span>
                    <span className="font-bold text-white min-w-[50px] text-right">
                      {detail.categoryScore != null ? `${Math.round(detail.categoryScore)} pts` : 'No route'}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 75
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : score >= 50
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        : score >= 25
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-gradient-to-r from-rose-500 to-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithm Modal */}
      {showInfoModal && (
        <div style={{ zIndex: 10000 }} className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Scoring Engine Algorithm (v{scoring.algorithmVersion})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <h5 className="font-bold text-white mb-1">1. Piecewise Walking-Time Decay</h5>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                  <li>0–5 minutes walk: <span className="text-emerald-400 font-semibold">100 points</span></li>
                  <li>&gt;5–10 minutes walk: <span className="text-indigo-400 font-semibold">90 points</span></li>
                  <li>&gt;10–15 minutes walk: <span className="text-blue-400 font-semibold">75 points</span></li>
                  <li>&gt;15–20 minutes walk: <span className="text-amber-400 font-semibold">55 points</span></li>
                  <li>&gt;20–30 minutes walk: <span className="text-orange-400 font-semibold">25 points</span></li>
                  <li>&gt;30 minutes walk: <span className="text-rose-400 font-semibold">0 points</span></li>
                </ul>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <h5 className="font-bold text-white mb-1">2. Top-Three Weighted Aggregation</h5>
                <p className="text-slate-400">
                  Category Score = <span className="text-indigo-300 font-semibold">0.70 × S₁ + 0.20 × S₂ + 0.10 × S₃</span>.
                  Rewards both close proximity of the nearest choice and variety of alternatives. Missing positions contribute 0.
                </p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <h5 className="font-bold text-white mb-1">3. Category Weights</h5>
                <p className="text-slate-400">
                  <strong className="text-white">Walkability (8 categories):</strong> Groceries 25%, Transit 20%, Dining 15%, Healthcare 15%, Parks 10%, Fitness 5%, Education 5%, Banking 5%.
                </p>
                <p className="text-slate-400 mt-1">
                  <strong className="text-white">Property Location (9 categories):</strong> Healthcare 20%, Education 20%, Groceries 15%, Transit 15%, Parks 10%, Dining 5%, Fitness 5%, Entertainment 5%, Banking 5%.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                <strong>Important Notice:</strong> This scoring system is an independent, open-source amenity-based location convenience engine. It is not affiliated with or equivalent to the proprietary Walk Score® algorithm. It does not evaluate crime rates, school test scores, environmental metrics, or property price appreciation.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

