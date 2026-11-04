import React from 'react';
import { Footprints, Motorbike, Car } from 'lucide-react';
import type { TravelMode } from '../types';

interface TravelModeSelectorProps {
  selectedMode: TravelMode;
  onChange: (mode: TravelMode) => void;
}

export const TravelModeSelector: React.FC<TravelModeSelectorProps> = ({
  selectedMode,
  onChange,
}) => {
  const modes: {
    id: TravelMode;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
    activeBg: string;
    activeBorder: string;
  }[] = [
    {
      id: 'WALKING',
      label: 'Walking',
      description: 'Pedestrian paths & walkways',
      icon: Footprints,
      accentColor: 'text-indigo-400',
      activeBg: 'bg-indigo-600/15',
      activeBorder: 'border-indigo-500',
    },
    {
      id: 'MOTORBIKE',
      label: 'Scooter / Bike',
      description: 'Motorized two-wheeler routing',
      icon: Motorbike,
      accentColor: 'text-emerald-400',
      activeBg: 'bg-emerald-600/15',
      activeBorder: 'border-emerald-500',
    },
    {
      id: 'CAR',
      label: 'Car',
      description: 'Automobile road network',
      icon: Car,
      accentColor: 'text-blue-400',
      activeBg: 'bg-blue-600/15',
      activeBorder: 'border-blue-500',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Travel Mode for Directions & Routes
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Affects map route & travel time
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              id={`travel-mode-${mode.id.toLowerCase()}`}
              onClick={() => onChange(mode.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${mode.activeBg} ${mode.activeBorder} shadow-md`
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? `${mode.activeBg} ${mode.accentColor}` : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className={`w-2 h-2 rounded-full ${mode.accentColor.replace('text-', 'bg-')}`}></span>
                )}
              </div>

              <div>
                <span
                  className={`text-xs font-bold block ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {mode.label}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                  {mode.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

