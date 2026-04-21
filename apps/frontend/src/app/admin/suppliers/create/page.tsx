"use client";

import React from "react";
import CreateSupplierClient from "./Client";
import { useSupplierActions } from "@/hooks/use-supplier";
import { AxiosResponse } from "axios";

export default function Page() {
  const { createSupplier } = useSupplierActions({hasToken: true,status:""});
  return (
    <CreateSupplierClient onSubmitSupplier={createSupplier} />
  );
}