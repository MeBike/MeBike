"use client";

import { useEffect, useRef } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";

interface StationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultCenter?: [number, number] | null; 
}

export function StationMap({ onLocationSelect, defaultCenter }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);
  const HCM_CITY: [number, number] = [106.6601, 10.7626];

  const currentCenter = defaultCenter && defaultCenter.length === 2 ? defaultCenter : HCM_CITY;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY?.trim();
    if (!mapRef.current || !apiKey) return;

    const map = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: currentCenter, 
      zoom: 14,
    });

    mapInstanceRef.current = map;

    // --- THÊM ĐOẠN NÀY ĐỂ HIỂN THỊ CỜ MẶC ĐỊNH ---
    const addMarker = (lng: number, lat: number) => {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new tt.Marker({ color: "#ef4444" }) // Màu đỏ cho nổi bật
          .setLngLat([lng, lat])
          .addTo(map);
      }
    };

    // Đặt cờ ngay khi load xong
    map.on("load", () => {
      map.resize();
      addMarker(currentCenter[0], currentCenter[1]);
    });
    // ---------------------------------------------

    map.on("click", (e: any) => {
      const { lat, lng } = e.lngLat;
      onLocationSelect(lat, lng);
      addMarker(lng, lat); // Dùng lại hàm addMarker
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); 

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={mapRef} className="w-full h-[500px] relative" />
      {/* CSS bắt buộc để cờ không bị nằm dưới bản đồ */}
      <style jsx global>{`
        .mapboxgl-marker {
          z-index: 999 !important;
        }
      `}</style>
    </div>
  );
}