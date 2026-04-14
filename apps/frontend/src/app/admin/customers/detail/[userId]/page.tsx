"use client";
import { useState, useEffect } from "react";
import { useUserActions } from "@/hooks/use-user";
import React from "react";
import DetailUser from "./DetailUser";
import { useUpdateProfileStaffMutation } from "@/hooks/mutations/User/useUpdateProfileStaffMutation";
import { useStationActions } from "@/hooks/use-station";
import { UpdateUserFormData } from "@/schemas";
import { LoadingScreen } from "../../components/loading-screen";
export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { detailUserData, isLoadingDetailUser, updateProfileUser } =
    useUserActions({
      hasToken: true,
      id: userId,
    });
  const { stations } = useStationActions({
    hasToken: true,
    page: 1,
    limit: 200,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingDetailUser) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailUser]);
  if (isLoadingDetailUser) {
    return <div>Loading...</div>;
  }
  if (!detailUserData) {
    return <div>Not found</div>;
  }
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  const handleSubmit = ({ data }: { data: UpdateUserFormData }) => {
    updateProfileUser(data);
  };
  return (
    <DetailUser
      user={detailUserData.data}
      onSubmit={handleSubmit}
      stations={stations}
    />
  );
}
