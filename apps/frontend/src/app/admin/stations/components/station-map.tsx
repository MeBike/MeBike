"use client";

import { useState, useMemo } from "react";
import Map, { Marker, MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface StationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  // Lưu ý: Mapbox mặc định tọa độ là [longitude, latitude]
  defaultCenter?: [number, number] | null;
}

// 1. Tọa độ chuẩn xác của khu vực Đại học FPT TP.HCM / Khu Công Nghệ Cao (D9)
const FPT_CAMPUS_CITY: [number, number] = [106.8098, 10.8411];

export function StationMap({
  onLocationSelect,
  defaultCenter,
}: StationMapProps) {
  // Lấy vị trí ban đầu (nếu có defaultCenter thì dùng, không thì lấy FPT)
  const initialCenter =
    defaultCenter && defaultCenter.length === 2 ? defaultCenter : FPT_CAMPUS_CITY;

  // Dùng state để quản lý tọa độ của cờ thay vì dùng useRef
  const [markerPos, setMarkerPos] = useState<[number, number]>(initialCenter);

  const initialViewState = useMemo(() => {
    return {
      longitude: initialCenter[0],
      latitude: initialCenter[1],
      // 2. Ép Zoom lên 16 để thấy rõ tên trường học, sông hồ, 3D toà nhà như mobile
      zoom: 16, 
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
          // Chuẩn Standard kết hợp với zoom 16 là bao đẹp, bao chi tiết
          mapStyle="mapbox://styles/mapbox/standard"
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