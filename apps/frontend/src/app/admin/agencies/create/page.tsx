"use client";

import React from "react";
import CreateAgencyClient from "./Client";
import { useAgencyActions } from "@/hooks/use-agency";

export default function Page() {
  const { createAgency } = useAgencyActions({ hasToken: true });

  return (
    <CreateAgencyClient 
      onCreateAgency={createAgency}
    />
  );
}