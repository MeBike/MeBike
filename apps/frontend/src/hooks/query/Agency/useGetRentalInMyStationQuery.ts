import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
import type { RentalStatus } from "@/types";
const fetchMyRental = async ({page,pageSize,status,userId,bikeId,startStation,endStation} : {page ?: number , pageSize ?: number , status ?: RentalStatus,userId?:string,bikeId?:string,startStation?:string,endStation?:string}) => {
  try {
    const query : Record < string , number | string > = {
      page : page ?? 1 ,
      pageSize : pageSize ?? 7,
    }
    if(status){
      query.status = status;
    }
    if(userId){
      query.userId = userId;
    }
    if(bikeId){
      query.bikeId = bikeId;
    }
    if(startStation){
      query.startStation = startStation;
    }
    if(endStation){
      query.endStation = endStation;
    }
    const response = await agencyService.getRentalInMyStation(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetRentalInMyStationAgency = ({page,pageSize,status,userId,bikeId,startStation,endStation} : {page ?: number , pageSize ?: number , status?: RentalStatus,userId?:string,bikeId?:string,startStation?:string,endStation?:string}) => {
  return useQuery({
    queryKey: ["data","rental-in-my-station","agency",page,pageSize,status,userId,bikeId,startStation,endStation],
    queryFn: () => fetchMyRental({ page, pageSize,status,userId,bikeId,startStation,endStation }),
    enabled:false,
  });
};
