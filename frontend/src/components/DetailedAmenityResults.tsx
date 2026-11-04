import React from 'react';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Info,
} from 'lucide-react';
import type { PlaceDetails, AmenityCategory, TravelMode } from '../types';
import { AMENITY_CONFIG } from './AmenitySelector';

interface DetailedAmenityResultsProps {
  categorizedPlaces: Record<AmenityCategory, PlaceDetails[]>;
  selectedCategories: AmenityCategory[];
  radiusKm: number;
  propertyLocation: { latitude: number; longitude: number; formattedAddress?: string } | null;
  focusedPlaceId?: string | null;
  onSelectPlace: (place: PlaceDetails) => void;
  onViewPlaceDetails: (place: PlaceDetails) => void;
  onShowRoute?: (place: PlaceDetails, mode: TravelMode) => void;
  activeFilter: AmenityCategory | 'ALL';
  onFilterChange: (filter: AmenityCategory | 'ALL') => void;
}

export const DetailedAmenityResults: React.FC<DetailedAmenityResultsProps> = ({
  categorizedPlaces,
  selectedCategories,
  radiusKm,
  propertyLocation,
  focusedPlaceId,
  onSelectPlace,
  onViewPlaceDetails,
  onShowRoute,
  activeFilter,
  onFilterChange,
}) => {
  const displayedCategories =
    activeFilter === 'ALL'
      ? selectedCategories
      : selectedCategories.filter((cat) => cat === activeFilter);

  const getDirectionsUrl = (place: PlaceDetails) => {
    if (propertyLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${propertyLocation.latitude},${propertyLocation.longitude}&destination=${place.latitude},${place.longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  };

  return (
    <div className="space-y-4">
      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Categories
        </button>
        {selectedCategories.map((catKey) => {
          const config = AMENITY_CONFIG.find((c) => c.id === catKey);
          if (!config) return null;
          const count = categorizedPlaces[catKey]?.length || 0;
          const isActive = activeFilter === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => onFilterChange(isActive ? 'ALL' : catKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{config.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Amenity Category Accordions/Sections */}
      <div className="space-y-5">
        {displayedCategories.map((catKey) => {
          const config = AMENITY_CONFIG.find((c) => c.id === catKey);
          if (!config) return null;
          const Icon = config.icon;
          const places = categorizedPlaces[catKey] || [];

          return (
            <div
              key={catKey}
              className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden"
            >
              {/* Category Subheader */}
              <div className="p-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.badgeBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    {config.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    ({places.length} verified places)
                  </span>
                </div>
              </div>

              {/* Places List */}
              <div className="divide-y divide-slate-800/60">
                {places.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No verified places found within {radiusKm} km.
                  </div>
                ) : (
                  places.map((place) => {
                    const isFocused = focusedPlaceId === place.id;

                    return (
                      <div
                        key={place.id}
                        onClick={() => onSelectPlace(place)}
                        className={`p-3.5 hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isFocused ? 'bg-indigo-950/30 border-l-4 border-indigo-500 pl-2.5' : ''
                        }`}
                      >
                        {/* Place Info */}
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 p-1 rounded-md bg-slate-800 text-slate-400 flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-white truncate hover:text-indigo-300">
                                {place.name}
                              </h5>
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {place.amenityType}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {place.address}
                            </p>

                            {/* Ratings & Operating Status */}
                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                              {place.rating != null ? (
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {place.rating.toFixed(1)} {place.userRatingsTotal ? `(${place.userRatingsTotal})` : ''}
                                </span>
                              ) : null}

                              {place.openNow !== undefined && place.openNow !== null && (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    place.openNow ? 'text-emerald-400' : 'text-slate-400'
                                  }`}
                                >
                                  {place.openNow ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" /> Open Now
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" /> Closed
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Distance Badge & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                          <div className="text-right mr-1">
                            <span className="text-xs font-bold text-indigo-400 block">
                              {place.distanceKm} km
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-tighter block">
                              Straight-line
                            </span>
                          </div>

                          {/* [Show Walking Route] */}
                          {onShowRoute && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowRoute(place, 'WALKING');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                              title="Show Walking Route on Map"
                            >
                              <span>🚶 Walk</span>
                            </button>
                          )}

                          {/* [View Details] Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewPlaceDetails(place);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                          >
                            <Info className="w-3 h-3 text-indigo-400" />
                            <span>Details</span>
                          </button>

                          {/* [Directions] Action (opens Google Maps) */}
                          <a
                            href={getDirectionsUrl(place)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm cursor-pointer"
                            title="Get Directions in Google Maps"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
