import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";

const getReportInProgress = async ({page , limit} : {page : number , limit : number}) => {
  try {
    const response = await reportService.getReportInProgress({page: page , limit : limit});
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetReportInProgressQuery = ({page,limit} : {page:number,limit:number}) => {
  return useQuery({
    queryKey: ["reports", "in-progress", page , limit],
    queryFn: () => getReportInProgress({page : page , limit : limit}),
    staleTime: 5 * 60 * 1000,
    enabled:false,
  });
};
