import React from 'react';
import { Compass } from 'lucide-react';

interface RadiusSelectorProps {
  radiusKm: number;
  onChange: (radius: number) => void;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({ radiusKm, onChange }) => {
  const options = [1, 3, 5, 10];

  return (
    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Common Search Radius
            </h4>
            <p className="text-[11px] text-slate-400">
              A single uniform boundary applied across all selected amenities
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          {radiusKm} km radius
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {options.map((rad) => {
          const isSelected = radiusKm === rad;
          return (
            <button
              key={rad}
              type="button"
              onClick={() => onChange(rad)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-750 hover:bg-slate-800 hover:text-white border-slate-700'
              }`}
            >
              {rad} km
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-2 italic">
        Any amenity place further than {radiusKm} km from the property will be strictly excluded.
      </p>
    </div>
  );
};

