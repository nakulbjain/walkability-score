import React, { useState, useEffect } from 'react';
import {
  Building2,
  LogOut,
  Sparkles,
  History,
  AlertCircle,
  Layers,
  Info,
  Trash2,
  AlertTriangle,
  Loader2,
  Compass,
  BarChart3,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  AmenityCategory,
  LocationSearchResult,
  AnalysisResponse,
  PlaceDetails,
  AnalysisHistoryItem,
  RouteResult,
  TravelMode,
} from '../types';
import { LocationSearchInput } from '../components/LocationSearchInput';
import { AmenitySelector } from '../components/AmenitySelector';
import { RadiusSelector } from '../components/RadiusSelector';
import { TravelModeSelector } from '../components/TravelModeSelector';
import { PropertyMap } from '../components/PropertyMap';
import { LocationOverview } from '../components/LocationOverview';
import { DetailedAmenityResults } from '../components/DetailedAmenityResults';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PlaceDetailsDrawer } from '../components/PlaceDetailsDrawer';
import { NearbyPlacesPanel } from '../components/NearbyPlacesPanel';
import { ScoreCards } from '../components/ScoreCards';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { ScoringVisualization } from '../components/ScoringVisualization';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  // Primary 3-Tab Dashboard State: 'explore' | 'analysis' | 'history'
  const [activeTab, setActiveTab] = useState<'explore' | 'analysis' | 'history'>('explore');

  // Location Selection State (Initially null - no property selected by default)
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);

  // Amenity Categories Selection State (Selected sectors for equal weighting)
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityCategory[]>([
    'HEALTHCARE',
    'EDUCATION',
    'GROCERY',
    'TRANSPORTATION',
  ]);

  // Single Common Search Radius State (Default 1 km)
  const [radiusKm, setRadiusKm] = useState<number>(1);

  // Analysis Result State
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active Route & Travel Mode State
  const [travelMode, setTravelMode] = useState<TravelMode>('WALKING');
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [activeRouteDestination, setActiveRouteDestination] = useState<PlaceDetails | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const routeRequestIdRef = React.useRef<number>(0);

  // Invalidate previous analysis results and routes whenever location or radius changes
  const handleLocationChange = (loc: LocationSearchResult | null) => {
    routeRequestIdRef.current += 1;
    setSelectedLocation(loc);
    setAnalysisResult(null);
    setActiveRoute(null);
    setActiveRouteDestination(null);
    setRouteError(null);
  };

  const handleRadiusChange = (newRadius: number) => {
    routeRequestIdRef.current += 1;
    setRadiusKm(newRadius);
    setAnalysisResult(null);
    setActiveRoute(null);
    setActiveRouteDestination(null);
    setRouteError(null);
  };

  // Active Map Filter and Focused Marker
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AmenityCategory | 'ALL'>('ALL');
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  // Selected place for Place Details Drawer
  const [activePlaceDetails, setActivePlaceDetails] = useState<PlaceDetails | null>(null);

  // Phase 2 Scoring Breakdown visibility
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(true);

  // Saved Analysis History State
  const [historyList, setHistoryList] = useState<AnalysisHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // History Deletion States
  const [deleteTargetItem, setDeleteTargetItem] = useState<AnalysisHistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [clearingAll, setClearingAll] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get<AnalysisHistoryItem[]>('/analysis/history');
      setHistoryList(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle Single Delete
  const handleConfirmDeleteSingle = async () => {
    if (!deleteTargetItem) return;
    setDeletingId(deleteTargetItem.id);
    setActionError(null);
    try {
      await api.delete(`/analyses/${deleteTargetItem.id}`);
      setHistoryList((prev) => prev.filter((item) => item.id !== deleteTargetItem.id));
      setDeleteTargetItem(null);
    } catch (err: any) {
      console.error('Failed to delete analysis', err);
      setActionError(err.response?.data?.message || 'Failed to delete saved analysis. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Clear All History
  const handleConfirmClearAll = async () => {
    setClearingAll(true);
    setActionError(null);
    try {
      await api.delete('/analyses/history');
      setHistoryList([]);
      setShowClearAllModal(false);
    } catch (err: any) {
      console.error('Failed to clear history', err);
      setActionError(err.response?.data?.message || 'Failed to clear all history. Please try again.');
    } finally {
      setClearingAll(false);
    }
  };

  // Handle map click / marker location pick
  const handleMapLocationPick = async (lat: number, lon: number) => {
    try {
      const res = await api.get('/location/reverse', {
        params: { lat, lon },
      });
      handleLocationChange({
        placeId: `picked-${Date.now()}`,
        name: res.data.formattedAddress?.split(',')[0] || 'Selected Location',
        formattedAddress: res.data.formattedAddress,
        locality: res.data.locality,
        city: res.data.city,
        state: res.data.state,
        latitude: lat,
        longitude: lon,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg && msg.toLowerCase().includes('india')) {
        alert(msg);
        return;
      }
      handleLocationChange({
        placeId: `picked-${Date.now()}`,
        name: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
        formattedAddress: `Custom Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        latitude: lat,
        longitude: lon,
      });
    }
  };

  // Run Location Analysis and auto-navigate to Analysis Tab
  const handleAnalyzeLocation = async () => {
    setAnalysisError(null);
    setActiveRoute(null);
    setActiveRouteDestination(null);

    // Validation
    if (!selectedLocation || !selectedLocation.latitude || !selectedLocation.longitude) {
      setAnalysisError('Please select a valid property location in India.');
      return;
    }

    if (selectedAmenities.length === 0) {
      setAnalysisError('Please select at least one amenity category to analyze.');
      return;
    }

    if (!radiusKm || radiusKm <= 0) {
      setAnalysisError('Please select a valid search radius.');
      return;
    }

    setAnalyzing(true);
    try {
      const payload = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radiusKm: radiusKm,
        amenities: selectedAmenities,
        formattedAddress: selectedLocation.formattedAddress,
        locality: selectedLocation.locality,
        city: selectedLocation.city,
        state: selectedLocation.state,
      };

      const res = await api.post<AnalysisResponse>('/analysis', payload);
      setAnalysisResult(res.data);
      setActiveCategoryFilter('ALL');
      fetchHistory(); // refresh history list
      setActiveTab('analysis'); // Auto-navigate to Analysis Tab
    } catch (err: any) {
      setAnalysisError(
        err.response?.data?.message || 'Failed to complete analysis. Please ensure coordinates are inside India.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Fetch actual route from backend with stale response guard
  const handleShowRoute = async (place: PlaceDetails, mode?: TravelMode) => {
    if (!selectedLocation) return;
    const targetMode = mode || travelMode;
    if (mode && mode !== travelMode) {
      setTravelMode(mode);
    }

    const currentRequestId = ++routeRequestIdRef.current;
    setLoadingRoute(true);
    setRouteError(null);

    try {
      const res = await api.get<RouteResult>('/routes', {
        params: {
          originLat: selectedLocation.latitude,
          originLon: selectedLocation.longitude,
          destLat: place.latitude,
          destLon: place.longitude,
          mode: targetMode,
        },
      });

      if (currentRequestId === routeRequestIdRef.current) {
        setActiveRoute(res.data);
        setActiveRouteDestination(place);
        setFocusedPlaceId(place.id);
        setActiveTab('explore'); // Ensure user is in explore tab to view map polyline
      }
    } catch (err: any) {
      if (currentRequestId === routeRequestIdRef.current) {
        setRouteError(
          err.response?.data?.message || `Actual ${targetMode.toLowerCase()} route is unavailable between these locations.`
        );
      }
    } finally {
      if (currentRequestId === routeRequestIdRef.current) {
        setLoadingRoute(false);
      }
    }
  };

  // Change travel mode and automatically refresh active route if one is displayed
  const handleTravelModeChange = (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (activeRouteDestination) {
      handleShowRoute(activeRouteDestination, newMode);
    } else {
      setActiveRoute(null);
    }
  };

  // Load an item from saved history
  const handleLoadHistoryItem = async (item: AnalysisHistoryItem, targetTab: 'explore' | 'analysis' = 'explore') => {
    setSelectedLocation({
      placeId: `hist-${item.id}`,
      name: item.formattedAddress?.split(',')[0] || 'Saved Location',
      formattedAddress: item.formattedAddress,
      locality: item.locality,
      city: item.city,
      state: item.state,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setRadiusKm(item.radiusKm);
    setSelectedAmenities(item.selectedAmenities);
    setActiveRoute(null);
    setActiveRouteDestination(null);

    // Fetch full saved analysis with scoring breakdown and places
    try {
      setAnalyzing(true);
      const res = await api.get<AnalysisResponse>(`/analysis/${item.id}`);
      setAnalysisResult(res.data);
      setActiveTab(targetTab);
    } catch (err) {
      console.error('Failed to load full analysis details', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Property Location Intelligence
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  India • Phase 2.2
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Equal Sector Weighting & Walkability Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile & Logout */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Three-Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-slate-800/80 bg-slate-900/50">
          <button
            type="button"
            id="tab-explore"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'explore'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Explore</span>
          </button>

          <button
            type="button"
            id="tab-analysis"
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase transition border-b-2 cursor-pointer relative ${
              activeTab === 'analysis'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>2. Analysis</span>
            {analysisResult && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            id="tab-history"
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>3. History</span>
            {historyList.length > 0 && (
              <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-slate-700">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {routeError && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{routeError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRouteError(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: EXPLORE
            ========================================================================= */}
        {activeTab === 'explore' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Property Configuration & Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Step 1: Property Location Selection Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Property Location
                    </h3>
                  </div>

                  <LocationSearchInput
                    selectedLocation={selectedLocation}
                    onSelectLocation={handleLocationChange}
                  />

                  {selectedLocation && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{selectedLocation.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {selectedLocation.formattedAddress}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1">
                        Coordinates: {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Amenity Category Selection Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Amenity Categories
                    </h3>
                  </div>

                  <AmenitySelector
                    selected={selectedAmenities}
                    onChange={(amenities) => {
                      setSelectedAmenities(amenities);
                      setAnalysisResult(null);
                    }}
                  />
                </div>

                {/* Step 3: Search Radius Selector */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Search Radius
                    </h3>
                  </div>

                  <RadiusSelector radiusKm={radiusKm} onChange={handleRadiusChange} />
                </div>

                {/* Step 4: Travel Mode Selector */}
                <TravelModeSelector
                  selectedMode={travelMode}
                  onChange={handleTravelModeChange}
                />

                {/* Error Banner */}
                {analysisError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{analysisError}</span>
                  </div>
                )}

                {/* Analyze Location Button */}
                <button
                  type="button"
                  id="analyze-location-btn"
                  onClick={handleAnalyzeLocation}
                  disabled={analyzing || !selectedLocation || selectedAmenities.length === 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Location & Calculating Equal Weights...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Location & View Scores</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Location Overview (if analysis completed) */}
                {analysisResult && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <LocationOverview
                      summaries={analysisResult.categorySummaries}
                      selectedCategories={analysisResult.selectedAmenities}
                      activeFilter={activeCategoryFilter}
                      onCategoryClick={(cat) =>
                        setActiveCategoryFilter(activeCategoryFilter === cat ? 'ALL' : cat)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Right Column: India-Focused Map & Places Exploration (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Active Analysis Banner Linking to Analysis Tab */}
                {analysisResult?.scoringResult && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          Analysis Complete
                          <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded text-white font-mono">
                            v{analysisResult.scoringResult.algorithmVersion}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Walkability: <strong className="text-indigo-400">{analysisResult.scoringResult.walkabilityScore?.toFixed(1) || 'N/A'}</strong> • Location Score: <strong className="text-emerald-400">{analysisResult.scoringResult.locationScore?.toFixed(1) || 'N/A'}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('analysis')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <span>View Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Map Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        India Geographic Map & Walking Directions
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Click within India to pick a property pin or click an amenity marker for verified details
                      </p>
                    </div>

                    {activeRoute && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRoute(null);
                            setActiveRouteDestination(null);
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear Route
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="h-[480px] w-full relative">
                    <ErrorBoundary>
                      <PropertyMap
                        propertyLocation={selectedLocation}
                        radiusKm={radiusKm}
                        amenities={analysisResult ? Object.values(analysisResult.categorizedPlaces).flat() : []}
                        selectedCategoryFilter={activeCategoryFilter}
                        onLocationPick={handleMapLocationPick}
                        focusedPlaceId={focusedPlaceId}
                        onMarkerClick={(p) => setFocusedPlaceId(p.id)}
                        onViewPlaceDetails={(p) => setActivePlaceDetails(p)}
                        onShowRoute={handleShowRoute}
                        activeRoute={activeRoute}
                        activeRouteDestination={activeRouteDestination}
                        loadingRoute={loadingRoute}
                        travelMode={travelMode}
                      />
                    </ErrorBoundary>
                  </div>
                </div>

                {/* Nearby Places Panel */}
                {analysisResult && (
                  <NearbyPlacesPanel
                    summaries={analysisResult.categorySummaries}
                    selectedCategories={analysisResult.selectedAmenities}
                    activeFilter={activeCategoryFilter}
                    categorizedPlaces={analysisResult.categorizedPlaces}
                    onCategoryFilterChange={setActiveCategoryFilter}
                    onSelectPlace={(p: PlaceDetails) => setFocusedPlaceId(p.id)}
                    onViewDetails={(p: PlaceDetails) => setActivePlaceDetails(p)}
                  />
                )}

                {/* Detailed Amenity Results (if analysis completed) */}
                {analysisResult && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">All Discovered Places</h3>
                        <p className="text-xs text-slate-400">
                          Verified places within {analysisResult.radiusKm} km search radius
                        </p>
                      </div>
                      <div className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Real OpenStreetMap Data</span>
                      </div>
                    </div>

                    <DetailedAmenityResults
                      categorizedPlaces={analysisResult.categorizedPlaces}
                      selectedCategories={analysisResult.selectedAmenities}
                      radiusKm={analysisResult.radiusKm}
                      propertyLocation={selectedLocation}
                      focusedPlaceId={focusedPlaceId}
                      onSelectPlace={(p) => setFocusedPlaceId(p.id)}
                      onViewPlaceDetails={(p) => setActivePlaceDetails(p)}
                      onShowRoute={handleShowRoute}
                      activeFilter={activeCategoryFilter}
                      onFilterChange={setActiveCategoryFilter}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ANALYSIS
            ========================================================================= */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-fade-in">
            {analysisResult?.scoringResult ? (
              <div className="space-y-6">
                {/* Analysis Scope & Equal Weighting Header */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Phase 2.2 Equal Sector Weighting
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          v{analysisResult.scoringResult.algorithmVersion}
                        </span>
                      </div>
                      <h2 className="text-base font-extrabold text-white mt-1.5">
                        {analysisResult.formattedAddress || 'Selected Property Location'}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Radius: <span className="text-white font-semibold">{analysisResult.radiusKm} km</span> • Evaluated Sectors:{' '}
                        <span className="text-indigo-400 font-semibold">{analysisResult.selectedAmenities.length} selected</span> (Equal weight{' '}
                        <span className="text-white font-semibold">{(100 / analysisResult.selectedAmenities.length).toFixed(1)}%</span> per sector)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('explore')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View on Map in Explore</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score Cards (Walkability & Location Score) */}
                <ScoreCards
                  scoring={analysisResult.scoringResult}
                  showBreakdown={showScoreBreakdown}
                  onToggleBreakdown={() => setShowScoreBreakdown(!showScoreBreakdown)}
                />

                {/* Comparative Scoring Visualization */}
                <ScoringVisualization scoring={analysisResult.scoringResult} />

                {/* Detailed Category Scoring Breakdown */}
                <ScoreBreakdown
                  scoring={analysisResult.scoringResult}
                  onFocusPlace={(placeId) => {
                    setFocusedPlaceId(placeId);
                    setActiveTab('explore');
                  }}
                  onShowRoute={handleShowRoute}
                />
              </div>
            ) : (
              /* Empty State when no analysis has been run yet */
              <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Location Analysis Generated Yet</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Head over to the <strong className="text-indigo-400">Explore</strong> tab, search an Indian locality or click the map to place a pin, choose your desired amenity sectors, and click <strong className="text-indigo-400">"Analyze Location"</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Go to Explore Tab</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: HISTORY
            ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            {/* History Header Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Previously Saved Analyses
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect past locations, compare scores, reload previous sessions, or manage your analysis history.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  Total Saved: <strong className="text-white">{historyList.length}</strong>
                </span>

                <button
                  type="button"
                  id="clear-all-history-btn"
                  disabled={historyList.length === 0 || clearingAll}
                  onClick={() => {
                    setActionError(null);
                    setShowClearAllModal(true);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition font-medium cursor-pointer px-3 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-800/60"
                  title="Clear all saved analyses"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Saved Analyses Cards Grid */}
            {loadingHistory ? (
              <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Loading your saved analyses...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-4">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Saved Analyses Found</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Whenever you analyze a property in India, it is securely persisted to PostgreSQL and will appear here with full scores and breakdown details.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Start New Analysis in Explore</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between gap-4 group"
                  >
                    <div>
                      {/* Top row: address and delete icon */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                            {item.formattedAddress}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {[item.locality, item.city, item.state].filter(Boolean).join(', ') || 'India'}
                          </p>
                        </div>
                        <button
                          type="button"
                          title="Delete this analysis"
                          aria-label={`Delete analysis for ${item.formattedAddress}`}
                          onClick={() => {
                            setActionError(null);
                            setDeleteTargetItem(item);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Scores & Radius Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3.5">
                        {item.walkabilityScore != null ? (
                          <div className="flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300">
                            <span>Walk Score:</span>
                            <span className="text-white">{item.walkabilityScore.toFixed(1)}</span>
                          </div>
                        ) : (
                          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs text-slate-400">
                            Walk: Unavailable
                          </div>
                        )}

                        {item.locationScore != null ? (
                          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300">
                            <span>Location Score:</span>
                            <span className="text-white">{item.locationScore.toFixed(1)}</span>
                          </div>
                        ) : (
                          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs text-slate-400">
                            Loc: Unavailable
                          </div>
                        )}

                        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700">
                          {item.radiusKm} km radius
                        </span>
                      </div>

                      {/* Amenities and Date */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800/80">
                        <span>{item.selectedAmenities.length} Evaluated Sectors</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadHistoryItem(item, 'explore')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Open in Explore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadHistoryItem(item, 'analysis')}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Analysis</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Individual Analysis Confirmation Modal */}
      {deleteTargetItem && (
        <div style={{ zIndex: 10000 }} className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Delete Saved Analysis</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to delete this property analysis from your history?
                </p>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 mb-5 space-y-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Location</span>
                <p className="text-xs font-medium text-slate-200 mt-0.5 break-words">
                  {deleteTargetItem.formattedAddress}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                <span>Date: {new Date(deleteTargetItem.createdAt).toLocaleDateString()} {new Date(deleteTargetItem.createdAt).toLocaleTimeString()}</span>
                <span>Radius: {deleteTargetItem.radiusKm} km</span>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                id="cancel-single-delete-btn"
                disabled={deletingId !== null}
                onClick={() => {
                  setDeleteTargetItem(null);
                  setActionError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-single-delete-btn"
                disabled={deletingId !== null}
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId !== null ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearAllModal && (
        <div style={{ zIndex: 10000 }} className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Clear All History</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete all your saved property analyses? This action cannot be undone.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                id="cancel-clear-all-btn"
                disabled={clearingAll}
                onClick={() => {
                  setShowClearAllModal(false);
                  setActionError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-clear-all-btn"
                disabled={clearingAll}
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place Details Drawer */}
      <PlaceDetailsDrawer
        place={activePlaceDetails}
        propertyLocation={selectedLocation}
        onClose={() => setActivePlaceDetails(null)}
        onShowRoute={handleShowRoute}
        activeTravelMode={travelMode}
      />
    </div>
  );
};
