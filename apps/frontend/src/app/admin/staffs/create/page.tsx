"use client";
import { useState , useEffect } from "react";
import { useUserActions } from "@/hooks/use-user";
import CreateStaff from "../components/create-staff";
import { UpdateStaffFormData } from "@/schemas/user-schema";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
export default function CreateStaffPage() {
  const { createStaff , getTechTeam , techTeam , isLoadingTechTeam} = useUserActions({ hasToken: true });
  const { stations } = useStationActions({ hasToken: true });
  const { suppliers } = useSupplierActions({ hasToken: true });
  const handleSubmit = async ({ data }: { data: UpdateStaffFormData }) => {
    await createStaff(data);
  };
  useEffect(() => {
    getTechTeam();
  },[getTechTeam])
  return (
    <div>
      <CreateStaff
        techTeam={techTeam?.data}
        onSubmit={handleSubmit}
        stations={stations}
        suppliers={suppliers}
      />
    </div>
  );
}
