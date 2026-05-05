"use client";

import { useState, useMemo } from "react";
import Map, { Marker, MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface StationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  // Lưu ý: Mapbox mặc định tọa độ là [longitude, latitude]
  defaultCenter?: [number, number] | null;
}

const HCM_CITY: [number, number] = [106.7865, 10.8415];

export function StationMap({ onLocationSelect, defaultCenter }: StationMapProps) {
  // Lấy vị trí ban đầu (nếu có defaultCenter thì dùng, không thì lấy HCM_CITY)
  const initialCenter =
    defaultCenter && defaultCenter.length === 2 ? defaultCenter : HCM_CITY;
  
  // Dùng state để quản lý tọa độ của cờ thay vì dùng useRef
  const [markerPos, setMarkerPos] = useState<[number, number]>(initialCenter);

  const initialViewState = useMemo(() => {
    return {
      longitude: initialCenter[0],
      latitude: initialCenter[1],
      zoom: 14,
    };
  }, [initialCenter]);

  // Xử lý sự kiện click trên bản đồ
  const handleMapClick = (e: MapMouseEvent) => {
    const { lat, lng } = e.lngLat;
    
    // Cập nhật vị trí cờ
    setMarkerPos([lng, lat]);
    
    // Trả data về component cha
    onLocationSelect(lat, lng);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-[500px] relative">
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAP_BOX_API_KEY}
          initialViewState={initialViewState}
          mapStyle="mapbox://styles/mapbox/streets-v12" // Bạn có thể đổi style tại đây
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Component Marker của react-map-gl sẽ tự render vị trí dựa vào state */}
          <Marker 
            longitude={markerPos[0]} 
            latitude={markerPos[1]} 
            color="#ef4444" 
            anchor="bottom"
          />
        </Map>
      </div>
    </div>
  );
}