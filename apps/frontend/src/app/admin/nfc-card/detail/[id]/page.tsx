"use client";

import { useEffect, use, useState } from "react";
import { useNFCCardActions } from "@/hooks/use-nfc";
import NFCDetailClient from "./client";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function NFCDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = use(params).id;
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
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
  useEffect(() => {
    if (isLoadingNFCCardDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingNFCCardDetail]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
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
