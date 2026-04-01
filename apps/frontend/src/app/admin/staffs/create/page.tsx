"use client";
import { useUserActions } from "@/hooks/use-user";
import CreateStaff from "../components/create-staff";
import { CreateUserFormData } from "@/schemas/user-schema";
import { useStationActions } from "@/hooks/use-station";
import { useSupplierActions } from "@/hooks/use-supplier";
export default function CreateStaffPage() {
  const { createUser } = useUserActions({ hasToken: true });
  const { stations } = useStationActions({ hasToken: true });
  const { suppliers } = useSupplierActions({ hasToken: true });
  const handleSubmit = async ({ data }: { data: CreateUserFormData }) => {
    await createUser(data);
  };
  return (
    <div>
      <CreateStaff
        onSubmit={handleSubmit}
        stations={stations}
        suppliers={suppliers}
      />
    </div>
  );
}
