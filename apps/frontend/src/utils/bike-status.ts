import type { BikeStatus } from "@/types";
export const getStatusColor = (status: BikeStatus) => {
  switch (status) {
    case "Booked":
      return "bg-yellow-100 text-yellow-800";
    case "Maintained":
      return "bg-blue-100 text-blue-800";
    case "Broken":
      return "bg-red-100 text-red-800";
    case "Available":
      return "bg-green-100 text-green-800";
    case "Reserved":
      return "bg-yellow-100 text-yellow-800";
    case "Unavailable":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};