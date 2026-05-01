import { CouponStat } from "@/types/Coupon";
import { ruleStatsColumns } from "@/columns/stats-by-rule-column";
import { DataTable } from "@/components/TableCustom";

export const CouponStatsView = ({ data }: { data: CouponStat | undefined }) => {
  if (!data) return <div className="p-4 text-center">Không có dữ liệu.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Tổng lượt thuê" value={data.summary.totalCompletedRentals} />
        <StatCard title="Tổng tiền giảm" value={`${data.summary.totalDiscountAmount.toLocaleString()}đ`} />
        <StatCard title="Tỷ lệ giảm" value={`${data.summary.discountRate}%`} />
        <StatCard title="TB mỗi lượt" value={`${data.summary.avgDiscountAmount.toLocaleString()}đ`} />
      </div>
      {data.topAppliedRule && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h4 className="font-bold text-blue-900">Quy tắc hàng đầu: {data.topAppliedRule.name}</h4>
          <p className="text-sm text-blue-700">Số lượt áp dụng: {data.topAppliedRule.appliedCount}</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value }: { title: string, value: string | number }) => (
  <div className="p-4 border rounded shadow-sm">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);