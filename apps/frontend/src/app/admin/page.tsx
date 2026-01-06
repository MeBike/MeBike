// "use client";
// import { useEffect } from "react";
// import { StatsCard } from "@/components/dashboard/stats-card";
// import { RentalChart } from "@/components/dashboard/rental-chart";
// import { RecentActivity } from "@/components/dashboard/recent-activity";
// import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";
// import { useAuth } from "@/providers/auth-providers";
// import { Progress } from "@/components/ui/progress";
// import { useUserActions } from "@/hooks/use-user";
// import { useBikeActions } from "@/hooks/use-bike";
// import { useRentalsActions } from "@/hooks/use-rental";
// import { formatRevenue } from "@/lib/formatVND";
// export default function DashboardPage() {
//   const { user } = useAuth();
//   const { newRegistrationStats, getNewRegistrationStats } = useUserActions({
//     hasToken: true,
//   }); 
//   const { statisticData, totalRecord , getStatisticsBike} = useBikeActions(true);
//   const { dashboardSummaryData, getDashboardSummary , getSummaryRental , summaryRental } = useRentalsActions({
//     hasToken: true,
//   });
//   useEffect(() => {
//     getDashboardSummary();
//   }, [getDashboardSummary]);
//   useEffect(() => {
//     getStatisticsBike();
//   }, [getStatisticsBike]);
//   useEffect(() => {
//     getNewRegistrationStats();
//   }, [getNewRegistrationStats]);
//   useEffect(() => {
//     getSummaryRental();
//   }, [getSummaryRental]);
//   const changePercentBike = statisticData?.result["CÓ SẴN"]
//     ? Math.round((statisticData.result["CÓ SẴN"] / totalRecord || 1) * 100)
//     : 0;
  
//   // const formattedValue =
//   //   monthlyRev && Number(monthlyRev) >= 1000000
//   //     ? `${(monthlyRev / 1000000).toFixed(1)}M VND`
//   //     : `${monthlyRev.toLocaleString('vi-VN')} VND`;

//   const changeRentPercent = dashboardSummaryData?.result.revenueSummary.today.totalRentals && dashboardSummaryData?.result.revenueSummary.yesterday.totalRentals
//     ? Math.round(
//         ((dashboardSummaryData.result.revenueSummary.today.totalRentals - dashboardSummaryData.result.revenueSummary.yesterday.totalRentals) /
//           dashboardSummaryData.result.revenueSummary.yesterday.totalRentals) *
//           100
//       )
//     : 0;
//   if (!user) {
//     return (
//       <div>
//         <Progress />
//       </div>
//     );
//   }
//   return (
//     <div>
//       <div className="space-y-8">
//         <section>
//           <h2 className="text-2xl font-bold text-foreground mb-4">
//             Thống kê tổng quan
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <StatsCard
//               title="Tổng lượt thuê hôm nay"
//               value={
//                 dashboardSummaryData
//                   ? dashboardSummaryData.result.revenueSummary.today.totalRentals.toString()
//                   : "0"
//               }
//               change={`${changeRentPercent}% so với hôm qua`}
//               changeType={changeRentPercent > 1 ? "positive" : "negative"}
//               icon={Bike}
//             />
//             <StatsCard
//               title="Xe đang cho thuê"
//               value={
//                 statisticData
//                   ? statisticData.result["ĐANG ĐƯỢC THUÊ"]?.toString()
//                   : "0"
//               }
//               change={`${
//                 changePercentBike > 1 ? "+" : ""
//               }${changePercentBike}% so với tháng trước`}
//               changeType={changePercentBike > 1 ? "positive" : "negative"}
//               icon={TrendingUp}
//             />
//             <StatsCard
//               title="Khách hàng mới trong tháng"
//               value={
//                 newRegistrationStats
//                   ? newRegistrationStats.result.newUsersThisMonth.toString()
//                   : "0"
//               }
//               change={`${
//                 (newRegistrationStats?.result.percentageChange ?? 0) > 1 ? "+" : ""
//               }${newRegistrationStats?.result.percentageChange ?? 0}% so với tháng trước`}
//               changeType={(newRegistrationStats?.result.percentageChange ?? 0) > 1 ? "positive" : "negative"}
//               icon={Users}
//             />
//             {/* <StatsCard
//               title="Khách hàng mới tháng trước"
//               value={
//                 newRegistrationStats
//                   ? newRegistrationStats.result.newUsersLastMonth.toString()
//                   : "0"
//               }
//               change="+8% tuần này"
//               changeType="positive"
//               icon={Users}
//             /> */}
//             <StatsCard
//               title="Doanh thu tháng này"
//               value={formatRevenue(
//                 summaryRental?.result?.monthlyRevenue.current
//               )}
//               icon={DollarSign}
//               change={`${
//                 (summaryRental?.result?.monthlyRevenue?.percentChange ?? 0) > 1 ? "+" : ""
//               }${summaryRental?.result?.monthlyRevenue?.percentChange ?? 0}% so với tháng trước`}
//               changeType={(summaryRental?.result?.monthlyRevenue?.percentChange ?? 0) > 1 ? "positive" : "negative"}
//             />
//           </div>
//         </section>

//         <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2">
//             <RentalChart
//               data={
//                 dashboardSummaryData?.result.hourlyRentalStats.map(
//                   (stat: { hour: string; totalRentals: number }) => ({
//                     time: stat.hour,
//                     rentals: stat.totalRentals,
//                   })
//                 ) || []
//               }
//             />
//           </div>
//           <div className="lg:col-span-1">
//             <RecentActivity />
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
export default function DashboardPage() {
  return (
    <div>
      Hello World
    </div>
  )
}

