"use client";
import React, { useState, useEffect } from "react";
import AgencyClient from "./AgencyClient";
import { useAgencyActions } from "@/hooks/use-agency";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import type { AgencyStatus } from "@/types";
import { useDebounce } from "@/utils/useDebounce";
export default function Page() {
  const [page, setPage] = useState(1);
  const [name, setName] = useState<string>("");
  const [stationAddress, setStationAddress] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [status, setStatus] = useState<AgencyStatus | "all">("all");
  const debouncedName = useDebounce(name, 500);
  const debouncedStationAddress = useDebounce(stationAddress, 500);
  const debouncedContactPhone = useDebounce(contactPhone, 500);
  const debouncedContactName = useDebounce(contactName, 500);
  const debouncedStatus = useDebounce(status, 500);
  const { agencies, isLoadingAgencies, getAgencies } = useAgencyActions({
    hasToken: true,
    pageSize: 7,
    page: page,
    name: debouncedName,
    stationAddress: debouncedStationAddress,
    contactPhone : debouncedContactPhone,
    contactName : debouncedContactName,
    status_agency : debouncedStatus,
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
