"use client"
import SupplierDetail from "./SupplierDetail";
import React from "react";
import { useSupplierActions } from "@/hooks/use-supplier";
export default function Page({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = React.use(params);
  const { detailSupplier, getUpdateSupplier , isLoadingDetailSupplier} = useSupplierActions({
    hasToken: true,
    supplier_id: supplierId,
  });

  const handleUpdateSupplier = async ({name , address , contactFee , phone } : {
    name?: string;
    address?: string;
    contactFee?: number;
    phone?: string;
  }) => {
    try {
       getUpdateSupplier({
        data: { 
          name : name,
          address : address,
          contactFee : contactFee,
          phone : phone
         },
        id: supplierId,
      });
    } catch (error) {
      console.error("Failed to update supplier:", error);
    }
  };  
  if (isLoadingDetailSupplier) {
    return <div>Loading...</div>;
  }

  return (
    <SupplierDetail
      supplier={detailSupplier || null}
      onSubmit={handleUpdateSupplier}
    />
  );
}
