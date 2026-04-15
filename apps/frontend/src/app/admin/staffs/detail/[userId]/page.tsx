"use client";
import { useUserActions } from "@/hooks/use-user";
import React, { useState, useEffect } from "react";
import DetailStaff from "./DetailStaff";
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
    if (!detailUserData) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin nhân viên.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
      return <LoadingScreen />;
    }
  const handleSubmit = ({ data }: { data: UpdateUserFormData }) => {
    updateProfileUser(data);
  };
  return (
    <DetailStaff
      user={detailUserData.data}
      onSubmit={handleSubmit}
      stations={stations}
    />
  );
}
