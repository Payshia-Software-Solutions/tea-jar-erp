"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";

interface OSMMapProps {
  initialLat?: string;
  initialLng?: string;
  onSelect: (lat: string, lng: string, address: string) => void;
  onCancel: () => void;
}

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function OSMMap({ initialLat, initialLng, onSelect, onCancel }: OSMMapProps) {
  const defaultCenter: [number, number] = [6.9271, 79.8612]; // Colombo
  const startLat = initialLat && !isNaN(parseFloat(initialLat)) ? parseFloat(initialLat) : defaultCenter[0];
  const startLng = initialLng && !isNaN(parseFloat(initialLng)) ? parseFloat(initialLng) : defaultCenter[1];

  const [position, setPosition] = useState<[number, number]>([startLat, startLng]);
  const [address, setAddress] = useState("");
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (e) {
        console.error(e);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLon = parseFloat(item.lon);
    setPosition([newLat, newLon]);
    setAddress(item.display_name);
    setSearchQuery(item.display_name);
    setShowSuggestions(false);
  };

  const handleFetchAddress = async (lat: number, lng: number) => {
    setFetchingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingAddress(false);
    }
  };

  useEffect(() => {
    if (initialLat && initialLng) {
      handleFetchAddress(startLat, startLng);
    }
  }, []);

  function MapEvents() {
    useMapEvents({
      click(e: any) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        handleFetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        const newLat = parseFloat(firstResult.lat);
        const newLon = parseFloat(firstResult.lon);
        setPosition([newLat, newLon]);
        setAddress(firstResult.display_name);
      } else {
        alert("Location not found.");
      }
    } catch (e) {
      console.error(e);
      alert("Error searching for location.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-muted p-3 rounded-lg text-sm flex gap-2 items-center">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div>Click anywhere on the map to drop a pin and extract coordinates.</div>
      </div>

      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <Input 
            placeholder="Search for a place (e.g. Colombo, Kandy)..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setShowSuggestions(false);
                handleSearch();
              }
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[1000] top-full mt-1 left-0 w-full bg-white dark:bg-zinc-900 border border-border shadow-lg rounded-md max-h-60 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-2 text-sm hover:bg-muted cursor-pointer border-b last:border-0"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button variant="secondary" onClick={() => {
          setShowSuggestions(false);
          handleSearch();
        }} disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border">
        <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customIcon} />
          <MapEvents />
          <MapUpdater center={position} />
        </MapContainer>
      </div>

      {address && (
        <div className="p-3 bg-primary/10 rounded-lg text-sm border border-primary/20">
          <strong>Address found:</strong> {address}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSelect(position[0].toString(), position[1].toString(), address)} disabled={fetchingAddress}>
          {fetchingAddress ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
