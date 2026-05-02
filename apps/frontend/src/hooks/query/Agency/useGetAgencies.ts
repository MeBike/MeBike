import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@constants";
import type { AgencyStatus } from "@/types/Agency";
const getAgencies = async ({
  page,
  pageSize,
  name,
  stationAddress,
  contactPhone,
  contactName,
  status,
}: {
  page?: number;
  pageSize?: number;
  name?: string;
  stationAddress?: string;
  contactPhone?: string;
  contactName?: string;
  status?: AgencyStatus | "all";
}) => {
  try {
    const query : Record < string , number | string > = {
      page : page ?? 1,
      pageSize : pageSize ?? 7
    }
    if (name) {
      query.name = name
    }
    if (stationAddress) {
      query.stationAddress = stationAddress
    }
    if (contactPhone) {
      query.contactPhone = contactPhone
    }
    if (contactName) {
      query.contactName = contactName
    }
    if (status && status !== "all") {
      query.status = status
    }
    const response = await agencyService.getAgencies(query);
    if (response.status === HTTP_STATUS.OK) {
        return response.data
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch agencies");
  }
};
export const useGetAgencies = ({page,pageSize,name,stationAddress,contactPhone,contactName,status}:{page?:number,pageSize?:number,name?:string,stationAddress?:string,contactPhone?:string,contactName?:string,status?:AgencyStatus | "all"}) => {
    return useQuery({
        queryKey:["data","agencies",page,pageSize,name,stationAddress,contactPhone,contactName,status],
        queryFn : () => getAgencies({page:page,pageSize:pageSize,name:name,stationAddress:stationAddress,contactPhone:contactPhone,contactName:contactName,status:status}),
        enabled:false,
    })
}
