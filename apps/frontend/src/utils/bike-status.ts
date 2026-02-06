import { BikeStatus } from "@/types";
export const getStatusColor = (status: BikeStatus) => {
  switch (status) {
    case "ĐANG ĐƯỢC THUÊ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐANG BẢO TRÌ":
      return "bg-blue-100 text-blue-800";
    case "BỊ HỎNG":
      return "bg-red-100 text-red-800";
    case "CÓ SẴN":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};