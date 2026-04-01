"use client";
import { useUserActions } from "@/hooks/use-user";
import CreateStaff from "../components/create-staff";
import { CreateUserFormData } from "@/schemas/user-schema";
export default function CreateStaffPage() {
  const { createUser } = useUserActions({ hasToken: true });
  const handleSubmit = async ({ data }: { data: CreateUserFormData }) => {
    await createUser(data);
  };
  return (
    <div>
      <CreateStaff onSubmit={handleSubmit} />
    </div>
  );
}