"use client";

import { useState, useEffect } from "react";
import { useNFCCardActions } from "@/hooks/use-nfc";
import { AssetStatus } from "@/types";
import NFCClient from "./client";

export default function Page() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssetStatus | "all">("all");

  const { 
    nfcCards, 
    isLoadingNFCCards, 
    getNFCCards, 
    createNFC,      // <-- Lấy hàm call api create từ hook
    isCreating      // <-- Lấy state loading từ hook
  } = useNFCCardActions({
    page,
    pageSize: 10,
  });

  useEffect(() => {
    getNFCCards();
  }, [page, status, getNFCCards]);

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