import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Crosshair,
  Navigation,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import type { PlaceDetails, AmenityCategory, RouteResult, TravelMode } from '../types';

interface PropertyMapProps {
  propertyLocation: { latitude: number; longitude: number; formattedAddress?: string } | null;
  radiusKm: number;
  amenities: PlaceDetails[];
  selectedCategoryFilter: AmenityCategory | 'ALL';
  onLocationPick?: (lat: number, lon: number) => void;
  focusedPlaceId?: string | null;
  onMarkerClick?: (place: PlaceDetails) => void;
  onViewPlaceDetails?: (place: PlaceDetails) => void;
  onShowRoute?: (place: PlaceDetails, mode: TravelMode) => void;
  activeRoute?: RouteResult | null;
  activeRouteDestination?: PlaceDetails | null;
  loadingRoute?: boolean;
  travelMode?: TravelMode;
}

// Category Colors
export const CATEGORY_COLORS: Record<AmenityCategory, string> = {
  HEALTHCARE: '#ef4444', // Red
  EDUCATION: '#3b82f6', // Blue
  GROCERY: '#f97316', // Orange
  FITNESS: '#a855f7', // Purple
  PARK: '#10b981', // Green
  ENTERTAINMENT: '#ec4899', // Pink
  DINING: '#eab308', // Amber/Yellow
  TRANSPORTATION: '#06b6d4', // Cyan
  BANKING: '#6366f1', // Indigo
};

// Recognizable Category-Specific SVG Icons matching user specifications
export const CATEGORY_ICONS_SVG: Record<AmenityCategory, string> = {
  // Healthcare: Hospital / medical cross
  HEALTHCARE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>`,

  // Education: Graduation cap / school
  EDUCATION: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,

  // Daily Essentials: Grocery basket / store
  GROCERY: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,

  // Fitness: Dumbbell
  FITNESS: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,

  // Recreation: Tree / park
  PARK: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7"/><path d="M7 15a5 5 0 0 1 1.7-9.7A6 6 0 0 1 20 8a4.5 4.5 0 0 1-1.5 8.7Z"/></svg>`,

  // Entertainment: Cinema / film
  ENTERTAINMENT: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/></svg>`,

  // Food & Dining: Restaurant / fork-and-knife
  DINING: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v10a2 2 0 0 0 2 2h1v8"/><path d="M5 6h4"/><path d="M8 2v4"/></svg>`,

  // Transportation: Bus / train
  TRANSPORTATION: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,

  // Banking & Services: Bank / building
  BANKING: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  propertyLocation,
  radiusKm,
  amenities,
  selectedCategoryFilter,
  onLocationPick,
  focusedPlaceId,
  onMarkerClick,
  onViewPlaceDetails,
  onShowRoute,
  activeRoute,
  activeRouteDestination,
  loadingRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const propertyMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Fullscreen and Locate Me States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);

  // Disable Leaflet click/scroll propagation on floating controls so clicks never trigger map pin placement
  useEffect(() => {
    if (controlsRef.current) {
      L.DomEvent.disableClickPropagation(controlsRef.current);
      L.DomEvent.disableScrollPropagation(controlsRef.current);
    }
  }, []);

  // Listen to fullscreen changes to update state and resize Leaflet map tiles
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 150);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Navigation Toolbar Handlers
  const handlePanUp = () => {
    mapInstanceRef.current?.panBy([0, -120], { animate: true });
  };

  const handlePanDown = () => {
    mapInstanceRef.current?.panBy([0, 120], { animate: true });
  };

  const handlePanLeft = () => {
    mapInstanceRef.current?.panBy([-120, 0], { animate: true });
  };

  const handlePanRight = () => {
    mapInstanceRef.current?.panBy([120, 0], { animate: true });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (propertyLocation) {
      mapInstanceRef.current.flyTo(
        [propertyLocation.latitude, propertyLocation.longitude],
        Math.max(mapInstanceRef.current.getZoom(), 14),
        { animate: true, duration: 0.8 }
      );
    } else {
      mapInstanceRef.current.flyTo([INDIA_CENTER_LAT, INDIA_CENTER_LON], 5, { animate: true, duration: 0.8 });
    }
  };

  const handleToggleFullscreen = () => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => setIsFullscreen(true));
      } else if ((wrapper as any).webkitRequestFullscreen) {
        (wrapper as any).webkitRequestFullscreen();
      } else if ((wrapper as any).msRequestFullscreen) {
        (wrapper as any).msRequestFullscreen();
      } else {
        setIsFullscreen(true);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      } else {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
      }
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (latitude < 6.0 || latitude > 37.5 || longitude < 68.0 || longitude > 98.0) {
          alert('Your current detected location is outside India. Map operations are restricted to Indian territory.');
          return;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { animate: true, duration: 1 });
        }
        if (onLocationPick) {
          onLocationPick(latitude, longitude);
        }
      },
      (err) => {
        setLocating(false);
        alert(`Location detection failed: ${err.message}. You can click directly on the map to place a property pin.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // India Geographic Scope Center & Bounds
  const INDIA_CENTER_LAT = 20.5937;
  const INDIA_CENTER_LON = 78.9629;
  const INDIA_BOUNDS: L.LatLngBoundsExpression = [
    [6.0, 68.0],   // Southwest corner of India region
    [37.5, 98.0],  // Northeast corner of India region
  ];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = propertyLocation ? propertyLocation.latitude : INDIA_CENTER_LAT;
    const initialLon = propertyLocation ? propertyLocation.longitude : INDIA_CENTER_LON;
    const initialZoom = propertyLocation ? 14 : 5;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: initialZoom,
        minZoom: 4,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 0.9,
        zoomControl: false,
      });

      // Standard OpenStreetMap Tile Provider
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Marker Cluster Group with custom radius styling
      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
      });
      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;

      mapInstanceRef.current = map;

      // Click to choose property location on map (restricted to India)
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (lat < 6.0 || lat > 37.5 || lng < 68.0 || lng > 98.0) {
          alert('Location must be within India. Please click within Indian territory.');
          return;
        }
        if (onLocationPick) {
          onLocationPick(lat, lng);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Property Center Marker and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!propertyLocation) {
      if (propertyMarkerRef.current) {
        map.removeLayer(propertyMarkerRef.current);
        propertyMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }
      return;
    }

    const { latitude, longitude, formattedAddress } = propertyLocation;
    if (
      latitude === undefined ||
      latitude === null ||
      isNaN(latitude) ||
      longitude === undefined ||
      longitude === null ||
      isNaN(longitude)
    ) {
      return;
    }

    // Center map on property
    map.setView([latitude, longitude], map.getZoom() || 14, { animate: true });

    // Property Custom Marker (Beacon home marker)
    const propertyIcon = L.divIcon({
      className: 'property-marker-root',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background-color: rgba(99, 102, 241, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background-color: #4f46e5; border: 3px solid #ffffff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (propertyMarkerRef.current) {
      propertyMarkerRef.current.setLatLng([latitude, longitude]);
      propertyMarkerRef.current.setIcon(propertyIcon);
      if (!map.hasLayer(propertyMarkerRef.current)) {
        propertyMarkerRef.current.addTo(map);
      }
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: propertyIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        if (onLocationPick) {
          onLocationPick(newPos.lat, newPos.lng);
        }
      });

      propertyMarkerRef.current = marker;
    }

    if (propertyMarkerRef.current) {
      propertyMarkerRef.current.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 2px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">Subject Property</div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${formattedAddress || 'Selected Location'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Drag marker or click map to change</div>
        </div>
      `);
    }

    // Radius Circle: Drawn strictly at radiusKm * 1000 meters
    const radiusMeters = radiusKm * 1000;
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([latitude, longitude]);
      radiusCircleRef.current.setRadius(radiusMeters);
      if (!map.hasLayer(radiusCircleRef.current)) {
        radiusCircleRef.current.addTo(map);
      }
    } else {
      const circle = L.circle([latitude, longitude], {
        radius: radiusMeters,
        color: '#4f46e5',
        fillColor: '#6366f1',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);
      radiusCircleRef.current = circle;
    }

    // Fit bounds on radius circle
    if (radiusCircleRef.current && map.hasLayer(radiusCircleRef.current)) {
      try {
        const bounds = radiusCircleRef.current.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.warn('Could not fit bounds on radius circle:', err);
      }
    }
  }, [propertyLocation, radiusKm]);

  // Render Amenity Markers inside radius with clustering
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    const filtered = amenities.filter((place) => {
      if (place.distanceKm > radiusKm) return false;
      if (selectedCategoryFilter === 'ALL') return true;
      return place.category === selectedCategoryFilter;
    });

    filtered.forEach((place) => {
      const color = CATEGORY_COLORS[place.category] || '#64748b';
      const iconSvg = CATEGORY_ICONS_SVG[place.category] || '';

      const markerIcon = L.divIcon({
        className: 'amenity-custom-marker',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            ${iconSvg}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: markerIcon });

      // Directions URL
      const directionsUrl = propertyLocation
        ? `https://www.google.com/maps/dir/?api=1&origin=${propertyLocation.latitude},${propertyLocation.longitude}&destination=${place.latitude},${place.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

      const sanitizedId = place.id.replace(/[^a-zA-Z0-9]/g, '_');

      // Bridge global handlers on window for Leaflet popup actions
      (window as any)[`handleViewDetails_${sanitizedId}`] = () => {
        if (onViewPlaceDetails) onViewPlaceDetails(place);
      };
      (window as any)[`handleShowRoute_WALK_${sanitizedId}`] = () => {
        if (onShowRoute) onShowRoute(place, 'WALKING');
      };
      (window as any)[`handleShowRoute_BIKE_${sanitizedId}`] = () => {
        if (onShowRoute) onShowRoute(place, 'MOTORBIKE');
      };
      (window as any)[`handleShowRoute_CAR_${sanitizedId}`] = () => {
        if (onShowRoute) onShowRoute(place, 'CAR');
      };

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase; background: ${color}15; padding: 2px 6px; border-radius: 4px;">
              ${place.category}
            </span>
            <span style="font-size: 11px; color: #64748b; font-weight: 500;">${place.amenityType}</span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3;">${place.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.3;">${place.address || 'Address not listed'}</div>
          
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; font-weight: 700; color: #1e293b;">
              📏 ${place.distanceKm} km
              <span style="font-size: 9px; color: #94a3b8; font-weight: normal; display: block;">Straight-line</span>
            </div>
            ${
              place.rating != null
                ? `<div style="font-size: 11px; font-weight: 700; color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">★ ${place.rating.toFixed(1)} ${place.userRatingsTotal ? `(${place.userRatingsTotal})` : ''}</div>`
                : (place.openNow !== undefined && place.openNow !== null
                    ? `<div style="font-size: 10px; font-weight: 600; color: ${place.openNow ? '#10b981' : '#f43f5e'};">${place.openNow ? '● Open Now' : '● Closed'}</div>`
                    : '')
            }
          </div>

          <!-- Interactive Multi-Mode Route Actions -->
          <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <button id="walk-btn-${sanitizedId}" onclick="window['handleShowRoute_WALK_${sanitizedId}']()" style="padding: 6px 4px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 2px;" title="Real pedestrian walking route">
              🚶 Walk
            </button>
            <button id="bike-btn-${sanitizedId}" onclick="window['handleShowRoute_BIKE_${sanitizedId}']()" style="padding: 6px 4px; background: #8b5cf6; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 2px;" title="Motorized scooter / bike route">
              🛵 Bike
            </button>
            <button id="car-btn-${sanitizedId}" onclick="window['handleShowRoute_CAR_${sanitizedId}']()" style="padding: 6px 4px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 2px;" title="Four-wheeler driving route">
              🚗 Car
            </button>
          </div>

          <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button id="view-details-${sanitizedId}" onclick="window['handleViewDetails_${sanitizedId}']()" style="padding: 6px 8px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              View Details
            </button>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #4f46e5; color: white; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;">
              Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(place);
      });

      marker.on('popupopen', () => {
        const walkBtn = document.getElementById(`walk-btn-${sanitizedId}`);
        if (walkBtn) {
          walkBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onShowRoute) onShowRoute(place, 'WALKING');
          };
        }
        const bikeBtn = document.getElementById(`bike-btn-${sanitizedId}`);
        if (bikeBtn) {
          bikeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onShowRoute) onShowRoute(place, 'MOTORBIKE');
          };
        }
        const carBtn = document.getElementById(`car-btn-${sanitizedId}`);
        if (carBtn) {
          carBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onShowRoute) onShowRoute(place, 'CAR');
          };
        }
        const detailsBtn = document.getElementById(`view-details-${sanitizedId}`);
        if (detailsBtn) {
          detailsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onViewPlaceDetails) onViewPlaceDetails(place);
          };
        }
      });

      clusterGroup.addLayer(marker);
      markersMapRef.current.set(place.id, marker);
    });
  }, [amenities, selectedCategoryFilter, radiusKm, propertyLocation]);

  // Focus marker if selected from list
  useEffect(() => {
    if (!focusedPlaceId || !mapInstanceRef.current) return;
    const marker = markersMapRef.current.get(focusedPlaceId);
    if (marker) {
      if (clusterGroupRef.current) {
        clusterGroupRef.current.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      } else {
        marker.openPopup();
        mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true });
      }
    }
  }, [focusedPlaceId]);

  // Render or clear Route Polyline on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) {
      return;
    }

    // GeoJSON coordinates are [lon, lat], Leaflet polyline expects [lat, lon]
    const latLngs: L.LatLngExpression[] = activeRoute.coordinates.map((pt) => [pt[1], pt[0]]);
    const isWalking = activeRoute.mode === 'WALKING';
    const isMotorbike = activeRoute.mode === 'MOTORBIKE';
    const routeColor = isWalking ? '#10b981' : isMotorbike ? '#a855f7' : '#3b82f6';

    const polyline = L.polyline(latLngs, {
      color: routeColor,
      weight: 5,
      opacity: 0.88,
      dashArray: isWalking ? '8, 8' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylineRef.current = polyline;

    try {
      const bounds = polyline.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.warn('Could not fit route bounds:', err);
    }
  }, [activeRoute]);

  return (
    <div
      ref={mapWrapperRef}
      className={`relative w-full overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950 transition-all ${
        isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none' : 'h-full min-h-[420px] rounded-xl'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Leaflet Navigation Controls Surface */}
      <div
        ref={controlsRef}
        className="absolute top-3 right-3 z-[1000] bg-white/95 text-slate-800 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-1.5 flex flex-col items-center gap-1 select-none"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* D-Pad Directional Pan Controls + Recenter Center Button */}
        <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
          {/* Row 1: Up */}
          <div />
          <button
            type="button"
            onClick={handlePanUp}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Pan Up"
            aria-label="Pan Up"
          >
            <ChevronUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>
          <div />

          {/* Row 2: Left, Recenter (Center), Right */}
          <button
            type="button"
            onClick={handlePanLeft}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Pan Left"
            aria-label="Pan Left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={propertyLocation ? 'Recenter on Selected Property' : 'Recenter on India'}
            aria-label="Recenter Map"
          >
            <Crosshair className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handlePanRight}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Pan Right"
            aria-label="Pan Right"
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>

          {/* Row 3: Down */}
          <div />
          <button
            type="button"
            onClick={handlePanDown}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Pan Down"
            aria-label="Pan Down"
          >
            <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>
          <div />
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 items-center">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-slate-200 my-0.5" />

        {/* Fullscreen & Locate Me Controls */}
        <div className="flex flex-col gap-1 items-center">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            title="Locate My Position"
            aria-label="Locate My Position"
          >
            <Navigation
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] ${
                locating ? 'animate-spin text-indigo-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Route Info Badge Overlay */}
      {activeRoute && activeRouteDestination && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-2xl max-w-sm animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {activeRoute.mode === 'WALKING' ? '🚶' : activeRoute.mode === 'MOTORBIKE' ? '🛵' : '🚗'}
              </span>
              <div>
                <p className="text-xs font-bold text-white line-clamp-1">
                  {activeRoute.mode === 'WALKING' ? 'Pedestrian' : activeRoute.mode === 'MOTORBIKE' ? 'Scooter / Bike' : 'Car Driving'} to {activeRouteDestination.name}
                </p>
                <p className="text-[11px] text-slate-300">
                  <span className="font-semibold text-emerald-400">
                    {activeRoute.distanceKm} km
                  </span>{' '}
                  •{' '}
                  <span className="font-semibold text-indigo-400">
                    {activeRoute.durationMinutes} min ({Math.round(activeRoute.durationSeconds)}s)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span>Provider: <strong className="text-slate-300">{activeRoute.provider}</strong></span>
              <span>Profile: <strong className="text-slate-300">{activeRoute.routingProfile || activeRoute.mode.toLowerCase()}</strong></span>
            </div>
          </div>
        </div>
      )}

      {loadingRoute && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 px-3 py-2 rounded-xl border border-slate-700 text-xs text-indigo-300 flex items-center gap-2 shadow-2xl">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          Calculating real route...
        </div>
      )}

      {/* Map Legend Overlay with Icon + Color + Category Name */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl max-w-[300px]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span>Map Legend</span>
          <span className="text-indigo-400 font-semibold">{radiusKm} km radius</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-300 col-span-2 pb-1 border-b border-slate-800/60">
            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span>Subject Property</span>
          </div>

          {Object.entries(CATEGORY_COLORS).map(([catKey, col]) => {
            const cat = catKey as AmenityCategory;
            const svgIcon = CATEGORY_ICONS_SVG[cat] || '';
            const label = cat === 'GROCERY' ? 'Daily Essentials' : cat.charAt(0) + cat.slice(1).toLowerCase();

            return (
              <div key={cat} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                  style={{ backgroundColor: col }}
                  dangerouslySetInnerHTML={{ __html: svgIcon.replace('width="16"', 'width="11"').replace('height="16"', 'height="11"') }}
                />
                <span className="truncate text-[11px]">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
