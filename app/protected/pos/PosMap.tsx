"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import L, { DivIcon, LatLngExpression } from "leaflet";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaCrosshairs,
  FaInfoCircle,
  FaPhone,
  FaClock,
  FaFilter,
  FaWifi,
  FaMobileAlt,
  FaPlaceOfWorship,
  FaStar,
  FaBan,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

// Import data
import markersData from '@/data/markers.json';
import zonesData from '@/data/zones.json';
import { MarkerData, ZoneData } from '../../../types/api/index';
import { Wifi } from "lucide-react";

// --- HELPER FUNCTIONS ---
const createCustomIcon = (color: string, iconType: 'default' | 'wifi' | 'mobile' | 'both' | 'geocoded' | 'star' | 'closed-wifi' = 'default') => {
  let iconComponent;

  switch (iconType) {
    case 'wifi':
      iconComponent = <FaWifi color={color} />;
      break;
    case 'mobile':
      iconComponent = <FaMobileAlt color={color} />;
      break;
    case 'both':
      iconComponent = (
        <div style={{ position: 'relative' }}>
          <FaWifi color={color} size={20} />
          <FaMobileAlt color={color} size={12} style={{ position: 'absolute', bottom: 0, right: 0 }} />
        </div>
      );
      break;
    case 'geocoded':
      iconComponent = <FaPlaceOfWorship color={color} />;
      break;
    case 'star':
      iconComponent = <Wifi color={color} />;
      break;
    case 'closed-wifi':
      iconComponent = (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <FaWifi color="#EF4444" size={24} />
          <FaBan color="#EF4444" size={28} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>
      );
      break;
    default:
      iconComponent = <FaMapMarkerAlt color={color} />;
  }

  const iconMarkup = renderToStaticMarkup(
    <div
      style={{
        color: color,
        fontSize: "32px",
        filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.7))",
        background: "rgba(0, 0, 0, 0.6)",
        borderRadius: "50%",
        padding: "4px",
      }}
    >
      {iconComponent}
    </div>
  );

  return new DivIcon({
    html: iconMarkup,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to change map view and zoom level
function ChangeMapCenter({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Check if POS is open based on Baghdad time
const isPosOpen = (workingHours?: string): boolean => {
  if (!workingHours) return false;

  const now = new Date();
  const baghdadTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Baghdad" }));
  const currentTime = baghdadTime.getHours() + (baghdadTime.getMinutes() / 60);

  const [start, end] = workingHours.split('-');
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startTime = startHour + (startMinute / 60);
  let endTime = endHour + (endMinute / 60);
  if (endTime < startTime) endTime += 24; // Handle overnight

  const currentTimeAdjusted = currentTime < startTime ? currentTime + 24 : currentTime;

  return currentTimeAdjusted >= startTime && currentTimeAdjusted <= endTime;
};

// Smart search function
const filterMarkers = (markers: MarkerData[], query: string, statusFilter: string): MarkerData[] => {
  return markers.filter(marker => {
    // Text search
    const matchesQuery = !query ||
      marker.title.toLowerCase().includes(query.toLowerCase()) ||
      marker.description.toLowerCase().includes(query.toLowerCase()) ||
      (marker.phone && marker.phone.includes(query));

    // Status filter
    const isOpen = isPosOpen(marker.workingHours);
    let matchesStatus = true;
    if (statusFilter === 'open') {
      matchesStatus = isOpen;
    } else if (statusFilter === 'closed') {
      matchesStatus = !isOpen;
    }

    return matchesQuery && matchesStatus;
  });
};

// Custom Hook for Debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- MAIN COMPONENT ---
export default function PosMap(): JSX.Element {
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.3152, 44.3661]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [inputValue, setInputValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [userMarker, setUserMarker] = useState<[number, number] | null>(null);
  const [mapsResults, setMapsResults] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true); // New state for sidebar

  const markers: any = markersData.markers;
  const zones: any = zonesData.zones;
  const debouncedInputValue = useDebounce(inputValue, 500);

  const filteredMarkers = useMemo(() =>
    filterMarkers(markers, inputValue, statusFilter),
    [markers, inputValue, statusFilter]
  );

  const highlightedMarkerIds = useMemo(() => new Set(filteredMarkers.map(m => m.id)), [filteredMarkers]);

  const getMarkerIcon = useCallback((marker: MarkerData) => {
    const isHighlighted = highlightedMarkerIds.has(marker.id);
    const isOpen = isPosOpen(marker.workingHours);

    if (isHighlighted) {
      return createCustomIcon('#FFD700', 'star');
    }

    if (marker.category === 'internet' || marker.category === 'both') {
      return isOpen ? createCustomIcon('#4ADE80', 'wifi') : createCustomIcon('#EF4444', 'closed-wifi');
    }

    const color = isOpen ? '#4ADE80' : '#EF4444';
    switch (marker.category) {
      case 'mobile':
        return createCustomIcon(color, 'mobile');
      default:
        return createCustomIcon(color);
    }
  }, [highlightedMarkerIds]);

  const searchWithMaps = async (query: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Baghdad, Iraq&format=json&limit=5`);
      const data = await response.json();
      return data.map((item: any) => ({
        type: 'geocoded',
        name: item.display_name,
        position: [parseFloat(item.lat), parseFloat(item.lon)],
      }));
    } catch (error) {
      console.error("Maps search failed:", error);
      return [];
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const zoneSuggestions = zones
      .filter((zone: any) => zone.name.toLowerCase().includes(query.toLowerCase()))
      .map((zone: any) => ({
        type: 'zone',
        name: zone.name,
        position: zone.coordinates[0],
      }));

    const localSuggestions = markers
      .filter((marker: any) => marker.title.toLowerCase().includes(query.toLowerCase()))
      .map((marker: any) => ({
        type: 'pos',
        name: marker.title,
        position: marker.position as [number, number],
      }));

    const geocodedSuggestions = await searchWithMaps(query);

    setSuggestions([...zoneSuggestions, ...localSuggestions, ...geocodedSuggestions]);
  }, [markers, zones]);

  useEffect(() => {
    if (debouncedInputValue) {
      fetchSuggestions(debouncedInputValue);
    } else {
      setSuggestions([]);
    }
  }, [debouncedInputValue, fetchSuggestions]);

  const handleSearch = async () => {
    setUserMarker(null);
    setShowSuggestions(false);
    setMapsResults([]);

    const parts = inputValue.split(",").map((p) => p.trim());
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      setMapCenter([lat, lng]);
      setMapZoom(17);
      setUserMarker([lat, lng]);
    } else {
      const foundZone = zones.find((z: any) => z.name.toLowerCase() === inputValue.toLowerCase());
      const foundMarker = markers.find((m: any) => m.title.toLowerCase() === inputValue.toLowerCase());

      if (foundZone) {
        setMapCenter(foundZone.coordinates[0] as [number, number]);
        setMapZoom(16);
      } else if (foundMarker) {
        setMapCenter(foundMarker.position as [number, number]);
        setMapZoom(17);
      } else {
        const mapsSearchResults = await searchWithMaps(inputValue);
        if (mapsSearchResults && mapsSearchResults.length > 0) {
          setMapsResults(mapsSearchResults);
          setMapCenter(mapsSearchResults[0].position as [number, number]);
          setMapZoom(17);
        } else {
          alert("No matching locations found.");
        }
      }
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setInputValue(suggestion.name);
    setShowSuggestions(false);
    setUserMarker(null);
    setMapsResults([]);

    if (suggestion.type === 'pos') {
      setMapCenter(suggestion.position);
      setMapZoom(15); // Changed from 17 to 15
    } else if (suggestion.type === 'zone') {
      setMapCenter(suggestion.position);
      setMapZoom(14); // Changed from 16 to 14
    } else if (suggestion.type === 'geocoded') {
      setMapCenter(suggestion.position);
      setMapZoom(15); // Changed from 17 to 15
      setMapsResults([{ name: suggestion.name, position: suggestion.position }]);
    }
  };


  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(17);
          setUserMarker([latitude, longitude]);
          setInputValue(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          alert("Failed to get location: " + error.message);
        }
      );
    } else {
      alert("Browser doesn't support geolocation");
    }
  };

  const userLocationIcon = createCustomIcon('#3B82F6');
  const geocodedIcon = createCustomIcon('#FFD700', 'geocoded');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col transition-colors duration-300">
      <header className="relative z-10 p-6 border-b border-border backdrop-blur-sm text-center">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold tracking-wide text-primary">
            POS Tracking System
          </h1>
          <p className="text-muted-foreground mt-2">
            View point of sale locations on the map and track geographical positions
          </p>
        </motion.div>
      </header>
      <main className={`relative z-10 flex-1 p-6 gap-6 max-w-7xl mx-auto w-full grid ${isSidebarVisible ? 'grid-cols-[1fr_384px]' : 'grid-cols-[1fr]'}`}>
        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border"
        >
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} className="z-0">
            <ChangeMapCenter center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zones.map((zone: any, index: number) => (
              <Polygon
                key={zone.name}
                positions={zone.coordinates}
                pathOptions={{
                  color: zone.color || polygonColors[index % polygonColors.length],
                  fillColor: zone.color || polygonColors[index % polygonColors.length],
                  fillOpacity: 0.4,
                  weight: 2,
                }}
              >
                {/* Popup for Zones - shows zone name on click */}
                <Popup className="theme-popup">
                  <div className="text-foreground font-bold text-base">{zone.name}</div>
                </Popup>
              </Polygon>
            ))}
            {markers.map((marker: any) => (
              <Marker key={marker.id} position={marker.position} icon={getMarkerIcon(marker)}>
                {/* Modified Popup for Markers */}
                <Popup className="theme-popup min-w-[300px]">
                  <div className="text-foreground">
                    <h3 className="font-bold text-lg mb-2">{marker.title}</h3>
                    {marker.phone && (
                      <p className="text-muted-foreground mb-1 flex items-center gap-2">
                        <FaPhone size={12} /> {marker.phone}
                      </p>
                    )}
                    {marker.workingHours && (
                      <p className="text-muted-foreground mb-1 flex items-center gap-2">
                        <FaClock size={12} />
                        <span className={isPosOpen(marker.workingHours) ? 'text-green-600' : 'text-red-500'}>
                          {marker.workingHours} {isPosOpen(marker.workingHours) ? '(Open)' : '(Closed)'}
                        </span>
                      </p>
                    )}
                    <p className="text-muted-foreground mt-2">{marker.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${marker.category === 'internet' ? 'bg-blue-600' :
                          marker.category === 'mobile' ? 'bg-purple-600' :
                            'bg-gradient-to-r from-blue-600 to-purple-600'
                        }`}>
                        {marker.category}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {userMarker && (
              <Marker position={userMarker} icon={createCustomIcon('#3B82F6')}>
                <Popup className="theme-popup">
                  <div className="text-foreground">
                    <h3 className="font-bold text-lg mb-1">Your Location</h3>
                    <p className="text-muted-foreground">
                      Coordinates: {userMarker[0].toFixed(6)}, {userMarker[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            {mapsResults.map((result, index) => (
              <Marker key={`maps-${index}`} position={result.position} icon={createCustomIcon('#FFD700', 'geocoded')}>
                <Popup className="theme-popup">
                  <div className="text-foreground">
                    <h3 className="font-bold text-lg mb-1">Search Result</h3>
                    <p className="text-muted-foreground">{result.name}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>

        {/* Sidebar container */}
        <AnimatePresence>
          {isSidebarVisible && (
            <motion.div
              initial={{ opacity: 0, x: 384 }} // 384px is the width of w-96
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 384 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative bg-card rounded-2xl shadow-xl p-6 border border-border w-96 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar"
            >
              {/* Toggle Sidebar Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSidebarVisible(false)}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 rounded-full shadow-lg"
              >
                <FaChevronLeft size={20} />
              </motion.button>

              {/* Search bar and buttons */}
              <div className="flex flex-col gap-4 items-center">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <FaSearch className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search by POS, Zone, or any location..."
                    className="pl-10 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                      {suggestions.map((s, index) => (
                        <li
                          key={index}
                          onMouseDown={() => handleSelectSuggestion(s)}
                          className="cursor-pointer p-3 hover:bg-muted transition-colors duration-200"
                        >
                          <div className="flex items-center gap-2">
                            {s.type === 'zone' ? (
                              <FaMapMarkerAlt className="text-cyan-500" />
                            ) : s.type === 'pos' ? (
                              <FaMapMarkerAlt className="text-green-500" />
                            ) : (
                              <FaPlaceOfWorship className="text-yellow-500" />
                            )}
                            <span className="text-foreground">{s.name}</span>
                            {s.type === 'zone' && <span className="text-xs text-muted-foreground"> (Zone)</span>}
                            {s.type === 'pos' && <span className="text-xs text-muted-foreground"> (POS Location)</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg w-full"
                >
                  <FaSearch /> Search
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={locateUser}
                  className="px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg w-full"
                >
                  <FaCrosshairs /> My Location
                </motion.button>
              </div>

              {/* Status Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:ring-primary"
                >
                  <option value="">All Status</option>
                  <option value="open">Open Now</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 gap-4 mt-6">
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-3 rounded-lg"><FaInfoCircle className="text-xl text-primary" /></div>
                    <div>
                      <h3 className="font-bold text-foreground">Total POS Locations</h3>
                      <p className="text-sm text-muted-foreground">{markers.length} registered points</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-3 rounded-lg"><FaMapMarkerAlt className="text-xl text-green-500" /></div>
                    <div>
                      <h3 className="font-bold text-foreground">Open Now</h3>
                      <p className="text-sm text-muted-foreground">
                        {markers.filter((m: any) => isPosOpen(m.workingHours)).length} locations
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-3 rounded-lg"><FaSearch className="text-xl text-blue-500" /></div>
                    <div>
                      <h3 className="font-bold text-foreground">Current View</h3>
                      <p className="text-sm text-muted-foreground">{mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 p-3 rounded-lg"><FaClock className="text-xl text-red-500" /></div>
                    <div>
                      <h3 className="font-bold text-foreground">Baghdad Time</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Baghdad" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSidebarVisible && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarVisible(true)}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 rounded-full shadow-lg"
          >
            <FaChevronLeft size={20} className="rotate-180" />
          </motion.button>
        )}
      </main>
    </div>
  );
}

// Keep the polygon colors array
const polygonColors = [
  "#e11d48", "#db2777", "#c026d3", "#9333ea", "#6d28d9", "#4f46e5",
  "#2563eb", "#0284c7", "#0891b2", "#0d9488", "#059669", "#16a34a",
  "#65a30d", "#ca8a04", "#f97316",
];