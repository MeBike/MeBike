"use client";
import { useUserActions } from "@/hooks/use-user";
import React from "react";
import DetailUser from "./DetailUser";
import { useUpdateProfileStaffMutation } from "@/hooks/mutations/User/useUpdateProfileStaffMutation";
import { useStationActions } from "@/hooks/use-station";
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
  const  {stations}  = useStationActions({
    hasToken: true,
    page: 1,
    limit: 200,
  });
  const updateProfileStaffMutation = useUpdateProfileStaffMutation();
  if (isLoadingDetailUser) {
    return <div>Loading...</div>;
  }
  if (!detailUserData) {
    return <div>Not found</div>;
  }
  return (
    <DetailUser
      user={detailUserData.data}
      updateProfileStaffMutation={updateProfileStaffMutation}
      stations={stations}
    />
  );
}