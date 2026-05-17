"use client";

import { useState, useEffect } from "react";
import { useNFCCardActions } from "@/hooks/use-nfc";
import { AssetStatus } from "@/types";
import NFCClient from "./client";
import { useDebounce } from "@/utils/useDebounce";

export default function Page() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssetStatus | "all">("all");
  const debouncedStatusFilter = useDebounce(status,500);
  const { 
    nfcCards, 
    isLoadingNFCCards, 
    getNFCCards, 
    createNFC,      
    isCreating      
  } = useNFCCardActions({
    page,
    pageSize: 10,
    status : debouncedStatusFilter 
  });

  useEffect(() => {
    getNFCCards();
  }, [page, debouncedStatusFilter, getNFCCards]);

  return (
    <NFCClient
      data={{
        nfcCards: nfcCards?.data || [],
        pagination: nfcCards?.pagination, 
        isLoading: isLoadingNFCCards,
        isCreating: isCreating, // Truyền loading vào client
      }}
      filters={{ page, statusFilter: status }}
      actions={{ 
        setPage, 
        setStatusFilter: setStatus,
        createNFC, // Truyền function tạo xuống client
      }}
    />
  );
}