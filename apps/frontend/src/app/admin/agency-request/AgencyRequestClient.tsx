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
import ActionRequestModal from "./components/ActionModal";
export default function AgencyRequestClient() {
  const router = useRouter();
  // State quản lý Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "APPROVE" | "REJECT" | null;
    selectedId: string | null;
  }>({ isOpen: false, type: null, selectedId: null });
  const [page, setPage] = useState(1);
  const {
    agencyRequest,
    isLoadingAgencyRequest,
    getAgencyRequest,
    approveAgencyRequest,
    rejectAgencyRequest,
  } = useAgencyActions({
    hasToken: true,
    pageSize: 7,
    page: page,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Hàm xử lý khi nhấn nút xác nhận trong Modal
  const handleConfirmAction = async (payload: {
    description?: string;
    reason?: string;
  }) => {
    if (!modalState.selectedId || !modalState.type) return;

    setIsProcessing(true);
    try {
      if (modalState.type === "APPROVE") {
        await approveAgencyRequest({
          id: modalState.selectedId,
          description: payload.description,
        });
      } else {
        await rejectAgencyRequest({
          id: modalState.selectedId,
          reason: payload.reason,
          description: payload.description,
        });
      }
      setModalState({ isOpen: false, type: null, selectedId: null });
      getAgencyRequest(); 
    } finally {
      setIsProcessing(false);
    }
  };
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingAgencyRequest) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencyRequest]);
  useEffect(() => {
    getAgencyRequest();
  }, [getAgencyRequest]);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Agency</h1>
        <Button onClick={() => router.push("/admin/bikes/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm agency
        </Button>
      </div>
      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hiển thị {agencyRequest?.pagination?.page ?? 1} /{" "}
              {agencyRequest?.pagination?.totalPages ?? 1} trang
            </p>
            <DataTable
              columns={agencyRequestColumn({
                onView: ({ id }) =>
                  router.push(`/admin/agency-request/detail/${id}`),
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
              data={agencyRequest?.data || []}
            />
            <ActionRequestModal
              isOpen={modalState.isOpen}
              type={modalState.type}
              isLoading={isProcessing}
              onClose={() => setModalState({ ...modalState, isOpen: false })}
              onConfirm={handleConfirmAction}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={agencyRequest?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={agencyRequest?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
