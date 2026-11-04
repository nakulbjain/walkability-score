import React from 'react';
import {
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Dumbbell,
  Trees,
  Film,
  UtensilsCrossed,
  Train,
  Landmark,
  Check,
  AlertCircle,
  Percent,
} from 'lucide-react';
import type { AmenityCategory } from '../types';

export interface AmenityMetadata {
  id: AmenityCategory;
  title: string;
  subcategories: string[];
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  borderHover: string;
}

export const AMENITY_CONFIG: AmenityMetadata[] = [
  {
    id: 'HEALTHCARE',
    title: 'Healthcare',
    subcategories: ['Hospitals', 'Clinics', 'Pharmacies'],
    icon: HeartPulse,
    color: 'text-rose-500',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderHover: 'hover:border-rose-500/50',
  },
  {
    id: 'EDUCATION',
    title: 'Education',
    subcategories: ['Schools', 'Colleges', 'Universities'],
    icon: GraduationCap,
    color: 'text-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderHover: 'hover:border-blue-500/50',
  },
  {
    id: 'GROCERY',
    title: 'Daily Essentials',
    subcategories: ['Grocery stores', 'Supermarkets'],
    icon: ShoppingBag,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderHover: 'hover:border-amber-500/50',
  },
  {
    id: 'FITNESS',
    title: 'Fitness',
    subcategories: ['Gyms', 'Sports centres'],
    icon: Dumbbell,
    color: 'text-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderHover: 'hover:border-purple-500/50',
  },
  {
    id: 'PARK',
    title: 'Recreation',
    subcategories: ['Parks', 'Playgrounds'],
    icon: Trees,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderHover: 'hover:border-emerald-500/50',
  },
  {
    id: 'ENTERTAINMENT',
    title: 'Entertainment',
    subcategories: ['Cinemas', 'Malls', 'Entertainment centres'],
    icon: Film,
    color: 'text-pink-500',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    borderHover: 'hover:border-pink-500/50',
  },
  {
    id: 'DINING',
    title: 'Food & Dining',
    subcategories: ['Restaurants', 'Cafés'],
    icon: UtensilsCrossed,
    color: 'text-orange-500',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    borderHover: 'hover:border-orange-500/50',
  },
  {
    id: 'TRANSPORTATION',
    title: 'Transportation',
    subcategories: ['Metro stations', 'Bus stops', 'Railway stations'],
    icon: Train,
    color: 'text-cyan-500',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderHover: 'hover:border-cyan-500/50',
  },
  {
    id: 'BANKING',
    title: 'Banking & Services',
    subcategories: ['Banks', 'ATMs'],
    icon: Landmark,
    color: 'text-indigo-500',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    borderHover: 'hover:border-indigo-500/50',
  },
];

interface AmenitySelectorProps {
  selected: AmenityCategory[];
  onChange: (categories: AmenityCategory[]) => void;
}

export const AmenitySelector: React.FC<AmenitySelectorProps> = ({ selected, onChange }) => {
  const toggleAmenity = (cat: AmenityCategory) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((item) => item !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  const selectAll = () => {
    onChange(AMENITY_CONFIG.map((item) => item.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCount = selected.length;
  const equalWeightPercent = selectedCount > 0 ? (100 / selectedCount).toFixed(1) : '0.0';

  return (
    <div className="space-y-3">
      {/* Controls Header: Selection Count, Equal Weight, and Select/Clear Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            Selected:{' '}
            <strong className="text-white font-semibold">
              {selectedCount} of {AMENITY_CONFIG.length}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium text-[11px]">
            <Percent className="w-3 h-3 text-purple-400" />
            <span>Equal {equalWeightPercent}% each</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            title="Select all 9 amenity categories"
          >
            Select All
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            title="Clear all selected categories"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Zero Selection Notice */}
      {selectedCount === 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Please select at least 1 amenity category to analyze walkability and location score.</span>
        </div>
      )}

      {/* Compact Responsive Category Selection Grid (3 columns on desktop, 2 columns on mobile) */}
      <div
        role="group"
        aria-label="Amenity category selection"
        className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5"
      >
        {AMENITY_CONFIG.map((item) => {
          const isSelected = selected.includes(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggleAmenity(item.id)}
              title={`${item.title} (${item.subcategories.join(', ')})`}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                isSelected
                  ? 'bg-purple-950/25 border-purple-500/40 text-purple-100 ring-1 ring-purple-500/25 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? item.badgeBg : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {item.title}
                </span>
              </div>

              {/* Compact Checkbox Indicator */}
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'border-slate-700 bg-slate-900/80'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
