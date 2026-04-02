"use client";
import { useUserActions } from "@/hooks/use-user";
import React from "react";
import DetailUser from "./DetailUser";
import { useUpdateProfileStaffMutation } from "@/hooks/mutations/User/useUpdateProfileStaffMutation";
import { useStationActions } from "@/hooks/use-station";
import { UpdateUserFormData } from "@/schemas";
export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { detailUserData, isLoadingDetailUser , updateProfileUser} = useUserActions({
    hasToken: true,
    id: userId,
  });
  const  {stations}  = useStationActions({
    hasToken: true,
    page: 1,
    limit: 200,
  });
  if (isLoadingDetailUser) {
    return <div>Loading...</div>;
  }
  if (!detailUserData) {
    return <div>Not found</div>;
  }
  const handleSubmit = ({data} : {data:UpdateUserFormData}) => {
      updateProfileUser(data) 
  };
  return (
    <DetailUser
      user={detailUserData.data}
      onSubmit={handleSubmit}
      stations={stations}
    />
  );
}