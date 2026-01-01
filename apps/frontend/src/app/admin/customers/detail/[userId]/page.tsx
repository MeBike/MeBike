"use client";
import { useUserActions } from "@/hooks/use-user";
import React from "react";
import DetailUser from "./DetailUser";
export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { detailUserData, isLoadingDetailUser } = useUserActions({
    hasToken: true,
    id: userId,
  });
  if (isLoadingDetailUser) {
    return <div>Loading...</div>;
  }
  if (!detailUserData) {
    return <div>Not found</div>;
  }
  return <DetailUser user={detailUserData} />;
}
