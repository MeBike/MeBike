"use client";
import React, { useState, useEffect } from "react";
import AgencyClient from "./AgencyClient";
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import type { AgencyStatus } from "@/types";
export default function Page() {
  const [page, setPage] = useState(1);
  const [name, setName] = useState<string>("");
  const [stationAddress, setStationAddress] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [status, setStatus] = useState<AgencyStatus | "all">("all");
  const { agencies, isLoadingAgencies, getAgencies } = useAgencyActions({
    hasToken: true,
    pageSize: 7,
    page: page,
    name : name,
    stationAddress : stationAddress,
    contactPhone : contactPhone,
    contactName : contactName,
    status_agency : status,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingAgencies) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAgencies]);
  useEffect(() => {
    getAgencies();
  }, [getAgencies,page,name,stationAddress,contactPhone,contactName,status]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!agencies) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin agency.
        </p>
      </div>
    );
  }
  return (
    <>
      <AgencyClient
      agencies={agencies}
      isVisualLoading={isVisualLoading}
      filters={{
        name,
        stationAddress,
        contactPhone,
        contactName,
        status,
        page
      }}
      actions={{
        setName,
        setStationAddress,
        setContactPhone,
        setContactName,
        setStatus,
        setPage,
        handleReset: () => {
          setName("");
          setStationAddress("");
          setContactPhone("");
          setContactName("");
          setStatus("all");
          setPage(1);
        }
      }}
    />
    </>
  );
}
