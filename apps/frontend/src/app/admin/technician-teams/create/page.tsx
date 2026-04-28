"use client";

import React from "react";
import CreateTechnicianTeamClient from "./client";
import { useTechnicianTeamActions } from "@/hooks/use-tech-team";
import { useStationActions } from "@/hooks/use-station";

export default function CreateTechnicianTeamPage() {
  const { createTechnicianTeam } = useTechnicianTeamActions({ hasToken: true });
  const { stations } = useStationActions({ hasToken: true });

  return (
    <CreateTechnicianTeamClient 
      onSubmitTeam={createTechnicianTeam}
      stations={stations}
    />
  );
}