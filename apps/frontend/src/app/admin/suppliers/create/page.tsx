"use client";

import React from "react";
import CreateSupplierClient from "./Client";
import { useSupplierActions } from "@/hooks/use-supplier";

export default function Page() {
  const { createSupplier } = useSupplierActions({ hasToken: true });
  return (
    <CreateSupplierClient onSubmitSupplier={createSupplier} />
  );
}