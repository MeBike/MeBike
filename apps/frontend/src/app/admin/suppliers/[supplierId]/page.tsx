"use client";

import React, { useState, useEffect } from "react";
import SupplierDetailClient from "./SupplierDetailClient";
import { useSupplierActions } from "@/hooks/use-supplier";
import { UpdateSupplierSchema } from "@/schemas/supplier-schema";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import type { Supplier } from "@/types";

export default function Page({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = React.use(params);

  const {
    detailSupplier,
    isLoadingDetailSupplier,
    fetchDetailSupplier,
    getUpdateSupplier,
    bikeStats,
  } = useSupplierActions({
    hasToken: true,
    supplier_id: supplierId,
    status :"",
  });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);

  useEffect(() => {
    if (supplierId) {
      fetchDetailSupplier();
    }
  }, [supplierId, fetchDetailSupplier]);

  useEffect(() => {
    if (isLoadingDetailSupplier) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailSupplier]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const supplier = detailSupplier as unknown as Supplier | undefined;
  if (!supplier) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <h2 className="text-xl font-semibold">Không tìm thấy nhà cung cấp</h2>
      </div>
    );
  }
  const handleSubmit = async (data: UpdateSupplierSchema) => {
    const result = await getUpdateSupplier({ id: supplierId, data });
    if (result) {
      fetchDetailSupplier();
      return true;
    }
    return false;
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <SupplierDetailClient
          supplierId={supplierId}
          supplier={supplier}
          bikeStats={bikeStats}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
