import React from 'react';
import {
  X,
  MapPin,
  Compass,
  Phone,
  Globe,
  Clock,
  Star,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import type { PlaceDetails, TravelMode } from '../types';
import { AMENITY_CONFIG } from './AmenitySelector';

interface PlaceDetailsDrawerProps {
  place: PlaceDetails | null;
  propertyLocation: { latitude: number; longitude: number; formattedAddress?: string } | null;
  onClose: () => void;
  onShowRoute?: (place: PlaceDetails, mode: TravelMode) => void;
  activeTravelMode?: TravelMode;
}

export const PlaceDetailsDrawer: React.FC<PlaceDetailsDrawerProps> = ({
  place,
  propertyLocation,
  onClose,
  onShowRoute,
  activeTravelMode,
}) => {
  if (!place) return null;

  const config = AMENITY_CONFIG.find((c) => c.id === place.category);
  const Icon = config?.icon || MapPin;

  // Google Maps Directions Link (Coordinates based for absolute precision)
  const getDirectionsUrl = () => {
    if (propertyLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${propertyLocation.latitude},${propertyLocation.longitude}&destination=${place.latitude},${place.longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  };

  // Google Maps Place / Location Link
  const getOpenInMapsUrl = () => {
    const encodedName = encodeURIComponent(place.name);
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}&query_place_id=${encodedName}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${config?.badgeBg || 'bg-slate-800 text-indigo-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {config?.title || place.category}
              </span>
              <p className="text-xs text-slate-300 font-medium">{place.amenityType}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 flex-1">
          {/* Place Name and Distance */}
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
              {place.name}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                {place.distanceKm} km from property
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Straight-line
              </span>
            </div>
          </div>

          {/* Interactive Routing Buttons */}
          {onShowRoute && (
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Actual Road Network Routes
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onShowRoute(place, 'WALKING')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                    activeTravelMode === 'WALKING'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300/80 border-emerald-500/30'
                  }`}
                >
                  <span className="text-sm">🚶</span>
                  <span>Walking</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowRoute(place, 'MOTORBIKE')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                    activeTravelMode === 'MOTORBIKE'
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-300/80 border-purple-500/30'
                  }`}
                >
                  <span className="text-sm">🛵</span>
                  <span>Bike / Scooter</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowRoute(place, 'CAR')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                    activeTravelMode === 'CAR'
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-300/80 border-blue-500/30'
                  }`}
                >
                  <span className="text-sm">🚗</span>
                  <span>Driving</span>
                </button>
              </div>
            </div>
          )}

          {/* Ratings (Only show if available, NEVER fabricate) */}
          {place.rating != null ? (
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">User Rating</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{place.rating.toFixed(1)}</span>
                {place.userRatingsTotal != null && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({place.userRatingsTotal.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* Location & Address */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Address & Location
            </span>
            <p className="text-xs text-slate-300 leading-relaxed pl-5">
              {place.address || 'Address not listed by provider'}
            </p>
            <p className="text-[11px] text-slate-500 pl-5">
              Coordinates: {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
            </p>
          </div>

          {/* Operating Hours (Genuinely known) */}
          {(place.openNow !== null && place.openNow !== undefined) || place.openingHours ? (
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Operating Hours
              </span>
              <div className="pl-5 space-y-1">
                {place.openNow !== null && place.openNow !== undefined && (
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                      place.openNow
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {place.openNow ? '● Open Now' : '● Closed'}
                  </span>
                )}
                {place.openingHours && (
                  <p className="text-xs text-slate-300 font-mono mt-1">{place.openingHours}</p>
                )}
              </div>
            </div>
          ) : null}

          {/* Contact Details & Links */}
          {(place.phoneNumber || place.website) && (
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Contact & Online Info
              </span>

              {place.phoneNumber && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a
                    href={`tel:${place.phoneNumber}`}
                    className="hover:text-indigo-400 transition underline"
                  >
                    {place.phoneNumber}
                  </a>
                </div>
              )}

              {place.website && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 transition truncate underline"
                  >
                    {place.website}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Provider Attribution & Traceability */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
            <span>Provider:</span>
            <span className="font-medium text-slate-400">
              {place.provider || 'OpenStreetMap'} {place.providerPlaceId ? `(#${place.providerPlaceId})` : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-800 pt-4 space-y-2.5">
          {/* Primary Action: Get Directions (Google Maps origin -> destination) */}
          <a
            href={getDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          {/* Secondary Action: Open in Maps (Destination view) */}
          <a
            href={getOpenInMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Open in Maps</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          {/* Optional Action: Visit Website */}
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Visit Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
