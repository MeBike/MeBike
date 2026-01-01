"use client";
import { useUserActions } from "@/hooks/use-user";
import CreateUser from "../components/create-user";
import { CreateUserFormData } from "@/schemas/userSchema";
export default function CreateCustomerPage() {
  const { createUser } = useUserActions({ hasToken: true });
  const handleSubmit = async ({ data }: { data: CreateUserFormData }) => {
    await createUser(data);
  };
  return (
    <div>
      <CreateUser onSubmit={handleSubmit} />
    </div>
  );
}
