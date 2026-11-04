import React from 'react';
import {
  Compass,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import type { AmenityCategory, PlaceDetails, CategorySummary } from '../types';
import { AMENITY_CONFIG } from './AmenitySelector';

interface NearbyPlacesPanelProps {
  summaries: Record<AmenityCategory, CategorySummary>;
  selectedCategories: AmenityCategory[];
  activeFilter: AmenityCategory | 'ALL';
  categorizedPlaces: Record<AmenityCategory, PlaceDetails[]>;
  onCategoryFilterChange: (cat: AmenityCategory | 'ALL') => void;
  onSelectPlace: (place: PlaceDetails) => void;
  onViewDetails: (place: PlaceDetails) => void;
}

export const NearbyPlacesPanel: React.FC<NearbyPlacesPanelProps> = ({
  summaries,
  selectedCategories,
  activeFilter,
  categorizedPlaces,
  onCategoryFilterChange,
  onSelectPlace,
  onViewDetails,
}) => {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Nearby Exploration Panel
          </h3>
        </div>
        {activeFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => onCategoryFilterChange('ALL')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="space-y-2">
        {selectedCategories.map((catKey) => {
          const config = AMENITY_CONFIG.find((c) => c.id === catKey);
          if (!config) return null;
          const Icon = config.icon;
          const summary = summaries[catKey];
          const count = summary?.totalCount || 0;
          const isSelected = activeFilter === catKey;
          const places = categorizedPlaces[catKey] || [];
          const nearestPlace = places.length > 0 ? places[0] : null;

          return (
            <div
              key={catKey}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              {/* Category Header Row (Filters map on click) */}
              <div
                onClick={() => onCategoryFilterChange(isSelected ? 'ALL' : catKey)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg ${config.badgeBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {config.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {count === 1 ? '1 verified place' : `${count} verified places`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      count > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      isSelected ? 'rotate-90 text-indigo-400' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Nearest Actual Establishment Highlight */}
              {nearestPlace && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-800/60 mt-1">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 pt-2">
                    Nearest:
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlace(nearestPlace);
                      onViewDetails(nearestPlace);
                    }}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/70 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                        {nearestPlace.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {nearestPlace.address}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md flex-shrink-0">
                      <Compass className="w-3 h-3 text-indigo-400" />
                      {nearestPlace.distanceKm} km
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

