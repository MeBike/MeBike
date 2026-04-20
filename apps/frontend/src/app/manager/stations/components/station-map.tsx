"use client";

import { useEffect, useRef } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";

interface StationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultCenter?: [number, number];
}

export function StationMap({ onLocationSelect, defaultCenter = [106.70098, 10.77689] }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!mapRef.current || !apiKey || mapInstanceRef.current) return;

    const map = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: defaultCenter,
      zoom: 14,
      style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main",
    });

    mapInstanceRef.current = map;

    map.on("load", () => {
      map.resize();
    });

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      onLocationSelect(lat, lng);

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new tt.Marker({ draggable: false })
          .setLngLat([lng, lat])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onLocationSelect, defaultCenter]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden h-full">
      <div className="border-b border-border bg-muted/30 px-6 py-5">
        <h2 className="text-lg font-semibold">Chọn vị trí trên bản đồ</h2>
        <p className="text-sm text-muted-foreground mt-1">Nhấp trên bản đồ để xác định tọa độ</p>
      </div>
      <div ref={mapRef} className="w-full h-[500px] bg-muted" />
    </div>
  );
}