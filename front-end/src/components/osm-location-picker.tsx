"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const OSMMap = dynamic(() => import("./osm-map"), { 
  ssr: false,
  loading: () => <div className="p-12 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
});

interface OSMLocationPickerProps {
  initialLat?: string;
  initialLng?: string;
  onSelect: (lat: string, lng: string, address: string) => void;
  onCancel: () => void;
}

export function OSMLocationPicker(props: OSMLocationPickerProps) {
  return <OSMMap {...props} />;
}
