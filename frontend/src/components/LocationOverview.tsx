import React from 'react';
import type { AmenityCategory, CategorySummary } from '../types';
import { AMENITY_CONFIG } from './AmenitySelector';

interface LocationOverviewProps {
  summaries: Record<AmenityCategory, CategorySummary>;
  selectedCategories: AmenityCategory[];
  onCategoryClick?: (category: AmenityCategory) => void;
  activeFilter?: AmenityCategory | 'ALL';
}

export const LocationOverview: React.FC<LocationOverviewProps> = ({
  summaries,
  selectedCategories,
  onCategoryClick,
  activeFilter,
}) => {
  if (!selectedCategories || selectedCategories.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Location Overview</h3>
          <p className="text-xs text-slate-400">
            Summary of selected amenity density and nearest accessibility
          </p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
          {selectedCategories.length} Categories Analyzed
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {selectedCategories.map((cat) => {
          const summary = summaries[cat];
          const config = AMENITY_CONFIG.find((c) => c.id === cat);
          if (!config) return null;
          const Icon = config.icon;
          const count = summary?.totalCount || 0;
          const isSelected = activeFilter === cat;

          return (
            <div
              key={cat}
              onClick={() => onCategoryClick && onCategoryClick(cat)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-750 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">{config.title}</span>
                <div className={`p-1.5 rounded-lg ${config.badgeBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white tracking-tight">{count}</span>
                <span className="text-xs text-slate-400">places</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Nearest:</span>
                <span className="font-semibold text-slate-200">
                  {summary?.nearestDistanceKm != null
                    ? `${summary.nearestDistanceKm} km`
                    : 'None found'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

