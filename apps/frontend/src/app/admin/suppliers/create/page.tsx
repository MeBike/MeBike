"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import { useSupplierActions } from "@/hooks/use-supplier";

export default function CreateSupplierPage() {
  const router = useRouter();
  const { createSupplier } = useSupplierActions(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone_number: "",
      contract_fee: "",
    },
  });

  const onSubmit = async (data: CreateSupplierSchema) => {
    try {
      const result = await createSupplier(data);
      if (result?.status === 200) {
        router.push("/admin/suppliers");
      }
    } catch (err) {
      // errors are handled in hook
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm nhà cung cấp</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tên nhà cung cấp
          </label>
          <Input
            {...register("name")}
            placeholder="Nhập tên nhà cung cấp"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Địa chỉ
          </label>
          <Input {...register("address")} placeholder="Nhập địa chỉ" />
          {errors.address && (
            <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Số điện thoại
          </label>
          <Input
            {...register("phone_number")}
            placeholder="Nhập số điện thoại"
          />
          {errors.phone_number && (
            <p className="text-sm text-red-500 mt-1">
              {errors.phone_number.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phí hợp đồng (0-1)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register("contract_fee")}
            placeholder="Nhập phí hợp đồng"
          />
          {errors.contract_fee && (
            <p className="text-sm text-red-500 mt-1">
              {errors.contract_fee.message}
            </p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Thêm
          </Button>
        </div>
      </form>
    </div>
  );
}
