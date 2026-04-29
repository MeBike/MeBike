"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { agencyRequestColumn } from "@/columns/agency-column";
import { AgencyActionProps, useAgencyActions } from "@/hooks/use-agency";
import { TableSkeleton } from "@/components/table-skeleton";
export default function AgencyRequestClient() {
  const router = useRouter();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "APPROVE" | "REJECT" | null;
    selectedId: string | null;
  }>({ isOpen: false, type: null, selectedId: null });
  const [page, setPage] = useState(1);
  const { myAgencyRequest, isLoadingMyAgencyRequest, getMyAgencyRequest } =
    useAgencyActions({
      hasToken: true,
      pageSize: 7,
      page: page,
    });
  const [isProcessing, setIsProcessing] = useState(false);

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingMyAgencyRequest) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyAgencyRequest]);
  useEffect(() => {
    getMyAgencyRequest();
  }, [getMyAgencyRequest]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Đăng ký Agency</h1>
        <Button onClick={() => router.push("/user/my-agency-request/create")}>
          <Plus className="mr-2 h-4 w-4" /> Đăng ký
        </Button>
      </div>
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {myAgencyRequest?.pagination?.page ?? 1} /{" "}
              {myAgencyRequest?.pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={agencyRequestColumn({
                onView: ({ id }) =>
                  router.push(`/user/my-agency-request/detail/${id}`),
                onApprove: ({ id }) =>
                  setModalState({
                    isOpen: true,
                    type: "APPROVE",
                    selectedId: id,
                  }),
                onReject: ({ id }) =>
                  setModalState({
                    isOpen: true,
                    type: "REJECT",
                    selectedId: id,
                  }),
              })}
              data={myAgencyRequest?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={myAgencyRequest?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={myAgencyRequest?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
