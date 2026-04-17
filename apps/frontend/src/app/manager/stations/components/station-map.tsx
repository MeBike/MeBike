"use client";

import { useEffect, useRef } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";

interface StationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  // Cho phép null để an toàn nếu component cha chưa fetch xong data
  defaultCenter?: [number, number] | null; 
}

export function StationMap({ onLocationSelect, defaultCenter }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);

  // 1. SAFEGUARD 1: Chống lỗi null/undefined từ API. Luôn fallback về SG nếu data hỏng.
  const safeCenter = (defaultCenter && defaultCenter.length === 2) 
    ? defaultCenter 
    : [106.70098, 10.77689] as [number, number];

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    // 2. SAFEGUARD 2: Cắt bỏ khoảng trắng thừa trong file .env (rất hay gặp)
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY?.trim();
    
    if (!mapRef.current || !apiKey || mapInstanceRef.current) return;

    const map = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: safeCenter, 
      zoom: 14,
      // 3. SAFEGUARD 3: Ép cứng API Key vào thẳng URL giao diện. 
      // Bỏ qua cơ chế tự nối chuỗi lởm khởm của SDK khi chạy trên Next.js
      style: `https://api.tomtom.com/style/1/style/21.1.0-*?map=hybrid_main&key=${apiKey}`,
    });

    mapInstanceRef.current = map;

    map.on("load", () => {
      map.resize();
    });

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      onLocationSelectRef.current(lat, lng);

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
  // Cố tình disable cảnh báo dependency để map chỉ mount 1 lần
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 4. Update tọa độ khi component cha đã load xong data
  useEffect(() => {
    if (mapInstanceRef.current && safeCenter) {
      mapInstanceRef.current.setCenter(safeCenter);
    }
  // So sánh giá trị nguyên thủy (từng số) thay vì array để tránh Re-render loop
  }, [safeCenter[0], safeCenter[1]]); 

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