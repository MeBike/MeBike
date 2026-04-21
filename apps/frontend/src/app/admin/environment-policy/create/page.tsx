"use client";

import CreateEnvironmentPolicyClient from "./Client";
import { useEnvironmentPolicy } from "@/hooks/use-environment-policy";

export default function CreateEnvironmentPolicyPage() {
  const { createEnvironmentPolicty } = useEnvironmentPolicy({ hasToken: true });

  return (
    <CreateEnvironmentPolicyClient onSubmitPolicy={createEnvironmentPolicty} />
  );
}