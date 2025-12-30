"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BikeCard } from "@/components/BikeCard";
import {
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Pencil,
  Save,
  X,
  Bike,
} from "lucide-react";
import { Supplier } from "@/types/supplier.type";
interface SupplierDetailProps {
  supplier: Supplier | null;
  onSubmit: ({
    name,
    address,
    contactFee,
    phone,
  }: {
    name?: string;
    address?: string;
    contactFee?: number;
    phone?: string;
  }) => void;
}
export default function SupplierDetail({
  supplier,
  onSubmit,
}: SupplierDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    phone: supplier?.contactInfo.phone || "",
    address: supplier?.contactInfo.address || "",
    contactFee: supplier?.contactFee || 0,
    status: supplier?.status || "active",
  });
  // useEffect(() => {
  //   if (supplier) {
  //     setFormData({
  //       name: supplier.name,
  //       phone: supplier.contactInfo.phone,
  //       address: supplier.contactInfo.address,
  //       contactFee: supplier.contactFee,
  //       status: supplier.status,
  //     });
  //   }
  // }, [supplier]);

  if (!supplier) {
    return (
      <div>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Supplier not found</p>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Khởi tạo object chứa các trường thay đổi
    const updatePayload: Parameters<typeof onSubmit>[0] = {};

    // So sánh từng trường, cái nào khác mới thêm vào payload
    if (formData.name !== supplier.name) {
      updatePayload.name = formData.name;
    }

    if (formData.phone !== supplier.contactInfo.phone) {
      updatePayload.phone = formData.phone;
    }

    if (formData.address !== supplier.contactInfo.address) {
      updatePayload.address = formData.address;
    }

    if (formData.contactFee !== supplier.contactFee) {
      updatePayload.contactFee = formData.contactFee;
    }

    // Kiểm tra nếu object payload rỗng (không có gì thay đổi)
    if (Object.keys(updatePayload).length === 0) {
      setIsEditing(false);
      return;
    }

    // Chỉ gửi những trường đã thay đổi
    onSubmit(updatePayload);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setFormData({
      name: supplier.name,
      phone: supplier.contactInfo.phone,
      address: supplier.contactInfo.address,
      contactFee: supplier.contactFee,
      status: supplier.status,
    });
    setIsEditing(false);
  };
  if (supplier === null) {
    return (
      <div>
        <div className="flex items-center justify-center h-[60vh]"></div>
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    );
  }
  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={`Supplier ID: ${supplier.id}`}
        backLink="/suppliers"
        actions={
          isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gradient-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Supplier Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">{supplier.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Badge
                  variant={
                    supplier.status === "Active" ? "success" : "secondary"
                  }
                >
                  {supplier.status === "Active" ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {supplier.contactInfo.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactFee">Contract Fee (per bike)</Label>
                {isEditing ? (
                  <Input
                    id="contactFee"
                    type="number"
                    value={formData.contactFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactFee: parseFloat(e.target.value),
                      })
                    }
                    step={0.01}
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    ${supplier.contactFee}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {supplier.contactInfo.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bikes from this supplier */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <Bike className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">
                Bikes from this Supplier ({supplier.bikes.length})
              </h2>
            </div>
            {supplier.bikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.bikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    station_name={bike.station?.name}
                    supplier_name={supplier.name}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No bikes from this supplier
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-card-foreground mb-4">
              Quick Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Phone className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">
                    {supplier.contactInfo.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <MapPin className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium text-foreground">
                    {supplier.contactInfo.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <DollarSign className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contract Fee</p>
                  <p className="text-sm font-medium text-foreground">
                    ${supplier.contactFee}/bike
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-card-foreground mb-4">
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">
                  {supplier.bikes.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Bikes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">
                  {
                    supplier.bikes.filter((b) => b.status === "Available")
                      .length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-card-foreground mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Calendar className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Partnership Started
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(supplier.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(supplier.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
