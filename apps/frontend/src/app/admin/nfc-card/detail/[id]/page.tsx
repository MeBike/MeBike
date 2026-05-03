"use client";

import { useEffect, use } from "react";
import { useNFCCardActions } from "@/hooks/use-nfc";
import NFCDetailClient from "./client";

export default function NFCDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = use(params).id;
  const {
    nfcCardDetail,
    getNFCCardDetail,
    isLoadingNFCCardDetail,
    assignNFC,
    unassignNFC,
    updateStatusNFC,
    isAssigning,
    isUnassigning,
    isUpdatingStatus,
  } = useNFCCardActions({
    id,
  });

  useEffect(() => {
    if (id) {
      getNFCCardDetail();
    }
  }, [id, getNFCCardDetail]);

  return (
    <NFCDetailClient
      data={{
        nfcCardDetail,
        isLoading: isLoadingNFCCardDetail,
      }}
      actions={{
        assignNFC,
        unassignNFC,
        updateStatusNFC,
        isAssigning,
        isUnassigning,
        isUpdatingStatus,
      }}
    />
  );
}
