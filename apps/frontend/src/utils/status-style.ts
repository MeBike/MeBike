import { BikeStatus } from "@/types";
export const getStatusColor = (status: "Active" | "Inactive") => {
  return status === "Active"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};
// export const getStatusBikeColor = ( status : BikeStatus) => {
//   return status === "Active"
//     ? "bg-green-100 text-green-800"
//     : "bg-red-100 text-red-800";
// };