import React from 'react';
import {
  HeartPulse,
  GraduationCap,
  ShoppingCart,
  Dumbbell,
  Trees,
  Film,
  UtensilsCrossed,
  Bus,
  Building2,
  Navigation,
  Footprints,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { AmenityCategory, ScoringResult, CategoryScoreDetail, ScoredAmenity, PlaceDetails, TravelMode } from '../types';

interface ScoreBreakdownProps {
  scoring: ScoringResult;
  onFocusPlace?: (placeId: string, lat: number, lon: number) => void;
  onShowRoute?: (place: PlaceDetails, mode: TravelMode) => void;
}

const CATEGORY_META: Record<
  AmenityCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bgColor: string }
> = {
  GROCERY: {
    label: 'Daily Essentials / Groceries',
    icon: ShoppingCart,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
  TRANSPORTATION: {
    label: 'Public Transportation',
    icon: Bus,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
  },
  DINING: {
    label: 'Food & Dining',
    icon: UtensilsCrossed,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  HEALTHCARE: {
    label: 'Healthcare',
    icon: HeartPulse,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
  },
  PARK: {
    label: 'Recreation & Parks',
    icon: Trees,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  FITNESS: {
    label: 'Fitness & Gyms',
    icon: Dumbbell,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  EDUCATION: {
    label: 'Education & Schools',
    icon: GraduationCap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  BANKING: {
    label: 'Banking & Services',
    icon: Building2,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
  },
  ENTERTAINMENT: {
    label: 'Entertainment & Culture',
    icon: Film,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
  },
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  scoring,
  onFocusPlace,
  onShowRoute,
}) => {
  const details = Object.values(scoring.categoryScores) as CategoryScoreDetail[];

  const handlePlaceClick = (amenity: ScoredAmenity) => {
    if (onFocusPlace) {
      onFocusPlace(amenity.id, amenity.latitude, amenity.longitude);
    }
    if (onShowRoute) {
      const mockPlace: PlaceDetails = {
        id: amenity.id,
        name: amenity.name,
        category: amenity.category as AmenityCategory,
        amenityType: amenity.category,
        address: amenity.address,
        latitude: amenity.latitude,
        longitude: amenity.longitude,
        distanceKm: amenity.haversineDistanceKm,
        distanceType: 'STRAIGHT_LINE_HAVERSINE',
      };
      onShowRoute(mockPlace, 'WALKING');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Footprints className="w-5 h-5 text-indigo-400" />
            Detailed Category Scoring Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent calculation showing category weights, top 3 contributing establishments, and exact walking times.
          </p>
        </div>
        <div className="text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 shrink-0">
          <span className="font-semibold text-white">Weighting: </span>
          <span>Equal Sector Weighting (100 / N%) • Algorithm v2.2</span>
        </div>
      </div>

      <div className="divide-y divide-slate-800/80">
        {details.map((detail) => {
          const meta = CATEGORY_META[detail.category] || {
            label: detail.categoryName,
            icon: Building2,
            color: 'text-slate-400',
            bgColor: 'bg-slate-800 border-slate-700',
          };
          const Icon = meta.icon;

          return (
            <div key={detail.category} className="py-4 space-y-3">
              {/* Category Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.bgColor} ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {meta.label}
                      {detail.status === 'COMPLETE' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {detail.status === 'PARTIAL' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {detail.status === 'UNAVAILABLE' && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {detail.explanation}
                    </p>
                  </div>
                </div>

                {/* Score & Weights */}
                <div className="flex items-center gap-4 text-right pl-12 sm:pl-0">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Walk Weight</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {detail.walkabilityWeight != null ? `${Number(detail.walkabilityWeight).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Loc Weight</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {detail.locationWeight != null ? `${Number(detail.locationWeight).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="min-w-[70px]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Category Score</span>
                    <span className="text-sm font-bold text-indigo-400">
                      {detail.categoryScore != null ? `${detail.categoryScore.toFixed(1)}/100` : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contributing Establishments */}
              {detail.topAmenities && detail.topAmenities.length > 0 ? (
                <div className="pl-12 grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {detail.topAmenities.map((amenity, idx) => (
                    <div
                      key={amenity.id || idx}
                      onClick={() => handlePlaceClick(amenity)}
                      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl p-2.5 transition cursor-pointer group flex flex-col justify-between"
                      title="Click to view walking directions on map"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
                            #{idx + 1} ({amenity.weightMultiplier ? `${Math.round(amenity.weightMultiplier * 100)}%` : ''})
                          </span>
                          <span className="text-xs font-bold text-emerald-400 shrink-0">
                            {amenity.accessibilityScore} pts
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition line-clamp-1 mt-1.5">
                          {amenity.name}
                        </h5>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {amenity.walkingDurationMinutes != null ? `${amenity.walkingDurationMinutes} min walk` : 'No route'}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-white transition">
                          <Navigation className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                          {amenity.haversineDistanceKm} km
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pl-12 text-xs text-slate-500 italic py-1">
                  {detail.discoveredCount === 0
                    ? 'No verified establishments found in this category within search radius.'
                    : 'Establishments discovered but walking routing is temporarily unavailable.'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

