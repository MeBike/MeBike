import { rentalService } from "@/services/rental.service";
import { useQuery } from "@tanstack/react-query";
const fetchDetailRentalAdmin = async (id: string) => {
  try {
    const response = await rentalService.getDetailRental(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch rental details");
  }
};

export const useGetDetailRentalAdminQuery = (id: string) => {
  return useQuery({
    queryKey: ["admin-rentals", "detail", id],
    queryFn: () => fetchDetailRentalAdmin(id),
    enabled: !!id,
  });
};
