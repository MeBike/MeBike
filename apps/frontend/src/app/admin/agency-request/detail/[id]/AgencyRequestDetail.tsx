"use client";

import { useParams, useRouter } from "next/navigation";
import { useAgencyActions } from "@/hooks/use-agency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function AgencyRequestDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    agencyRequestDetail, 
    isLoadingAgencyRequestDetail, 
    approveAgencyRequest, 
    rejectAgencyRequest 
  } = useAgencyActions({
    hasToken: true,
    agency_request_id: id as string,
  });

  if (isLoadingAgencyRequestDetail) return <Loader2 className="animate-spin" />;

  const data = agencyRequestDetail;

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Thông tin Agency</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Tên:</strong> {data?.agencyName}</p>
            <p><strong>Địa chỉ:</strong> {data?.agencyAddress}</p>
            <p><strong>Số điện thoại:</strong> {data?.agencyContactPhone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Thông tin Station</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Tên trạm:</strong> {data?.stationName}</p>
            <p><strong>Sức chứa:</strong> {data?.stationTotalCapacity} xe</p>
            <p><strong>Địa chỉ:</strong> {data?.stationAddress}</p>
          </CardContent>
        </Card>
      </div>

      {data?.status === "PENDING" && (
        <div className="flex gap-4 justify-end">
          <Button 
            variant="destructive" 
            onClick={() => rejectAgencyRequest({ id: id as string, reason: "Không đủ điều kiện" })}
          >
            <XCircle className="mr-2 h-4 w-4" /> Từ chối đơn
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => approveAgencyRequest({ id: id as string })}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Phê duyệt ngay
          </Button>
        </div>
      )}
    </div>
  );
}