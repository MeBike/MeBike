"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Station } from "@custom-types";
import Image from "next/image";
import { Footer } from "@/components/landing/landing-footer";
import { CTA } from "@/components/landing/cta";
import Header from "@/components/ui/layout/Header";
const Page = () => {
  const stations: Station[] = [
    {
      _id: "station_1",
      name: "Ga Bến Thành",
      address: "Lê Lợi, Bến Thành, Quận 1, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Bến Thành nằm tại trung tâm TP.HCM, kết nối với Chợ Bến Thành và Công viên 23/9, là ga ngầm lớn nhất của tuyến Metro số 1.",
      type: "Ga ngầm",
      bikeStation: {
        id: "BS001",
        stationId: 1,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "1",
    },
    {
      _id: "station_2",
      name: "Ga Nhà Hát Thành Phố",
      address: "Đồng Khởi, Bến Nghé, Quận 1, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Nhà hát Thành phố là một trong những nhà ga ngầm của Tuyến Metro số 1, nằm trên đường Lê Lợi, Quận 1, TP.HCM. Đây là nhà ga ngầm độc đáo, lấy cảm hứng thiết kế từ Nhà hát Thành phố với lối kiến trúc hiện đại, sang trọng.",
      type: "Ga ngầm",
      bikeStation: {
        id: "BS002",
        stationId: 2,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "2",
    },
    {
      _id: "station_3",
      name: "Ga Ba Son",
      address: "Tôn Đức Thắng, Bến Nghé, Quận 1, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Ba Son là một trong những nhà ga ngầm của Tuyến Metro số 1 nằm tại khu đô thị Vinhomes Golden River và Grand Marina Saigon. Ga được thiết kế với màu sắc chủ đạo là màu xanh và các thiết kế hình lượn sóng.",
      type: "Ga ngầm",
      bikeStation: {
        id: "BS003",
        stationId: 3,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "3",
    },
    {
      _id: "station_4",
      name: "Ga Văn Thánh",
      address: "Điện Biên Phủ, Đa Kao, Quận 1, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Văn Thánh là nhà ga loại A một trong những nhà ga trên cao của Tuyến số 1, là nhà ga trên cao chuyển tiếp xuống đoạn ngầm tại Ga Ba Son.",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS004",
        stationId: 4,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "4",
    },
    {
      _id: "station_5",
      name: "Ga Tân Cảng",
      address: "Điện Biên Phủ, 25, Quận Bình Thạnh, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Tân Cảng là nhà ga loại B, là nhà ga lớn nhất so với 10 nhà ga trên cao khác của tuyến đường sắt số 1 Bến Thành - Suối Tiên, với 4 làn tàu, 6.200m²",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS005",
        stationId: 5,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "5",
    },
    {
      _id: "station_6",
      name: "Ga Thảo Điền",
      address: "Võ Nguyên Giáp, Thảo Điền, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Thảo Điền là nhà ga loại A nằm tại phường Thảo Điền, có cầu bộ hành đi bộ băng qua Võ Nguyên Giáp (Xa lộ Hà Nội) và kết nối với bãi đỗ xe",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS006",
        stationId: 6,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "6",
    },
    {
      _id: "station_7",
      name: "Ga An Phú",
      address: "Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga An Phú là nhà ga loại C, nằm tại phường Thảo Điền, thành phố Thủ Đức, TP.HCM.",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS007",
        stationId: 7,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "7",
    },
    {
      _id: "station_8",
      name: "Ga Rạch Chiếc",
      address: "Xa lộ Hà Nội, An Phú, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Rạch Chiếc là nhà ga loại A, một trong những nhà ga của Tuyến Metro số 1, nằm tại phường An Phú, thành phố Thủ Đức, TP.HCM",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS008",
        stationId: 8,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "8",
    },
    {
      _id: "station_9",
      name: "Ga Phước Long",
      address: "Cảng Phước Long, Trường Thọ, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Phước Long là nhà ga loại A, một trong những nhà ga của Tuyến số 1, nằm tại cảng Phước Long, phường Trường Thọ, thành phố Thủ Đức, TP.HCM",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS009",
        stationId: 9,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "9",
    },
    {
      _id: "station_10",
      name: "Ga Bình Thái",
      address: "Đỗ Xuân Hợp, Trường Thọ, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Bình Thái là nhà ga loại A, một trong những nhà ga tàu điện của Tuyến Metro số 1, cách trường Đại học Kiến trúc TP.HCM (950m – 10 phút đi bộ)",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS010",
        stationId: 10,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "10",
    },
    {
      _id: "station_11",
      name: "Ga Thủ Đức",
      address: "Bình Thọ, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Thủ Đức là nhà ga loại A, nằm tại phường Bình Thọ, thành phố Thủ Đức, cách trường Đại học Sư phạm Kỹ thuật TP.HCM 600m (10 phút đi bộ).",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS011",
        stationId: 11,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "11",
    },
    {
      _id: "station_12",
      name: "Ga Khu Cộng Nghệ Cao",
      address: "Đại học Quốc Gia, Linh Trung, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Khu Công nghệ cao là nhà ga loại A, nằm đối diện Khu công nghệ cao TP.HCM, dự kiến thu hút lưu lượng lớn hành khách để đi làm việc, học tập tại đây",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS012",
        stationId: 12,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "12",
    },
    {
      _id: "station_13",
      name: "Ga Đại Học Quốc Gia",
      address: "Đại học Quốc Gia, Linh Trung, TP. Thủ Đức, TP.HCM",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Đại học Quốc Gia là nhà ga loại A, một trong những nhà ga tàu điện của Tuyến Metro số 1, nằm đối diện Khu du lịch Văn hóa Suối Tiên",
      type: "Ga trên cao",
      bikeStation: {
        id: "BS013",
        stationId: 13,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "13",
    },
    {
      _id: "station_14",
      name: "Ga Suối Tiên",
      address: "Bình Thắng, TP. Dĩ An, Bình Dương",
      latitude: "10.7769",
      longitude: "106.6951",
      capacity: "100",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      location_geo: {
        type: "Point",
        coordinates: [106.6951, 10.7769],
      },
      description:
        "Ga Bến xe Suối Tiên là nhà ga loại D, là nhà ga cuối cùng của Tuyến Metro số 1, nằm ngay Bến xe Miền Đông mới. Khoảng 5 – 15 phút đi bộ từ ga là Bến xe Miền Đông mới, Bệnh viện Ung Bướu TP. HCM – Cơ sở 2",
      type: "Ga cuối",
      bikeStation: {
        id: "BS014",
        stationId: 14,
        totalBikes: 20,
        availableBikes: 15,
        location: {
          lat: 10.7769,
          lng: 106.6951,
        },
        distance: 300,
      },
      stationNumber: "",
    },
  ];

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [, setBikeStation] = useState(
  stations.length > 0 && stations[0].bikeStation ? stations[0].bikeStation : null
);
  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    setBikeStation(station.bikeStation || null);
  };

  const getStationTypeColor = (type: string) => {
    switch (type) {
      case "Ga ngầm":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Ga trên cao":
        return "bg-green-100 text-green-800 border-green-200";
      case "Ga cuối":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <div className="relative">
        <div className="w-full h-64 bg-gradient-to-r from-blue-600 to-green-600 relative overflow-hidden">
          <Image
          width={1920}
          height={1080}
            src="/cam-nang-Metro.jpeg"
            alt="Metro Guide"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-green-600/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Tuyến Metro Số 1
              </h1>
              <p className="text-xl md:text-2xl font-light">
                Bến Thành - Suối Tiên
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  14 Ga
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  19.7 km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Station Selection Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Chọn ga để xem thông tin chi tiết
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {stations.map((station, index) => (
              <div key={index} className="flex flex-col">
                <Button
                  variant={
                    selectedStation?.name === station.name
                      ? "default"
                      : "outline"
                  }
                  className={`h-auto p-3 text-center transition-all duration-200 hover:scale-105 ${
                    selectedStation?.name === station.name
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                      : "hover:bg-blue-50 hover:border-blue-300"
                  }`}
                  onClick={() => handleStationClick(station)}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedStation?.name === station.name
                          ? "bg-white text-blue-600"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {station.stationNumber}
                    </div>
                    <span className="text-xs leading-tight">
                      {station.name.replace("Ga ", "")}
                    </span>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </div>
        {selectedStation && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl text-blue-800 mb-2">
                      {selectedStation.name}
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStationTypeColor(
                          selectedStation.type || ""
                        )}`}
                      >
                        {selectedStation.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Ga số {selectedStation.stationNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Địa chỉ
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedStation.address}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Thông tin chi tiết
                  </h3>
                  <p className="text-gray-600 leading-relaxed bg-blue-50 p-4 rounded-lg">
                    {selectedStation.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-blue-50"
                    onClick={() =>
                      alert(
                        "Chức năng này đang được phát triển. Vui lòng quay lại sau!"
                      )
                    }
                  >
                    Xem bản đồ
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-green-50"
                    onClick={() =>
                      alert(
                        "Chức năng này đang được phát triển. Vui lòng quay lại sau!"
                      )
                    }
                  >
                    Thuê xe
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-purple-50"
                    onClick={() =>
                      alert(
                        "Chức năng này đang được phát triển. Vui lòng quay lại sau!"
                      )
                    }
                  >
                    📱 Chia sẻ
                  </Button>
                </div>
                
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedStation && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚇</div>
            <h3 className="text-xl text-gray-600 mb-2">
              Chọn một ga để xem thông tin chi tiết
            </h3>
            <p className="text-gray-500">
              Nhấn vào bất kỳ ga nào ở trên để tìm hiểu thêm về ga đó
            </p>
          </div>
        )}
      </div>
      <CTA/>
      <Footer />
    </div>
  );
};

export default Page;
// import React from 'react'

// const page = () => {
//   return (
//     <div>
      
//     </div>
//   )
// }

// export default page
