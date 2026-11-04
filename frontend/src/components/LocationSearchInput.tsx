import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Crosshair } from 'lucide-react';
import { api } from '../services/api';
import type { LocationSearchResult } from '../types';

interface LocationSearchInputProps {
  onSelectLocation: (result: LocationSearchResult) => void;
  selectedLocation: LocationSearchResult | null;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  onSelectLocation,
  selectedLocation,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.formattedAddress || selectedLocation.name);
    } else {
      setQuery('');
    }
  }, [selectedLocation]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce search
    const timer = setTimeout(async () => {
      // Don't search if the query exactly matches the current selected formatted address
      if (selectedLocation && query === (selectedLocation.formattedAddress || selectedLocation.name)) {
        return;
      }

      setLoading(true);
      try {
        const response = await api.get<LocationSearchResult[]>('/location/search', {
          params: { q: query },
        });
        setSuggestions(response.data);
        setIsOpen(true);
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  const handleSelect = (item: LocationSearchResult) => {
    setQuery(item.formattedAddress || item.name);
    setIsOpen(false);
    onSelectLocation(item);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.get<LocationSearchResult>('/location/reverse', {
            params: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            },
          });
          const item: LocationSearchResult = {
            placeId: 'current-pos',
            name: res.data.formattedAddress?.split(',')[0] || 'My Location',
            formattedAddress: res.data.formattedAddress,
            locality: res.data.locality,
            city: res.data.city,
            state: res.data.state,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          handleSelect(item);
        } catch (err: any) {
          const errMsg = err.response?.data?.message || 'Could not resolve current location. Ensure you are within India.';
          alert(errMsg);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        alert('Geolocation permission denied or unavailable: ' + err.message);
        setLoading(false);
      }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Search Property Location (India Only)
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
        >
          <Crosshair className="w-3 h-3" />
          Use GPS Location
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search Indian cities, localities, addresses (e.g. Indiranagar, Bengaluru)..."
          className="block w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <div
              key={item.placeId || index}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-slate-700/70 cursor-pointer transition border-b border-slate-700/50 last:border-b-0 flex items-start gap-2.5"
            >
              <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">{item.name}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {item.formattedAddress}
                </p>
                {(item.city || item.state) && (
                  <span className="inline-block mt-1 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                    {[item.locality, item.city, item.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
