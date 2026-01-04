"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Save, X, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
import { Progress } from "@radix-ui/react-progress";
import { useAuthActions } from "@/hooks/useAuthAction";
import Image from "next/image";
import { UpdateProfileSchemaFormData } from "@/schemas/authSchema";
import Link from "next/link";
import { VerifyEmailModal } from "@/components/modals/VerifyEmailModal";
import { uploadImageToFirebase } from "@/lib/firebase";
import { Me } from "@/types/GraphQL";
import { formatToVNTime } from "@/lib/formateVNDate";
import Profile from "@/components/common/Profile";
type FormDataWithAvatar = Me & { avatarFile?: File };

// Compress image function
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const imgElement = document.createElement("img");
      imgElement.src = event.target?.result as string;
      imgElement.onload = () => {
        const canvas = document.createElement("canvas");
        let width = imgElement.naturalWidth;
        let height = imgElement.naturalHeight;

        // Max dimensions
        const maxWidth = 800;
        const maxHeight = 800;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(imgElement, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob!], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.7
        );
      };
    };
  });
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [data, setData] = useState<Me | null>(null);
  const [formData, setFormData] = useState<FormDataWithAvatar>(
    () => user || ({} as Me)
  );
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { resendVerifyEmail, verifyEmail } = useAuthActions();
  useEffect(() => {
    if (user) {
      setData(user);
      setFormData(user as Me);
      setAvatarPreview(user.avatarUrl ?? "");
      console.log(user);
    }
  }, [user]);
  if (!user || !data) {
    return (
      <div>
        <Progress />
      </div>
    );
  }
  const handleInputChange = (field: keyof Me, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleUserAccountChange = (
    key: keyof Me["userAccount"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      userAccount: {
        ...prev.userAccount,
        [key]: value,
      },
    }));
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Lưu file để upload sau khi Save
      setFormData((prev) => ({ ...prev, avatarFile: file }));

      // Tạo preview ngay lập tức
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const fields: (keyof UpdateProfileSchemaFormData)[] = [
      "name",
      "YOB",
      "avatarUrl",
      "nfcCardUid",
      "phone",
      "address",
    ];

    const updatedData = fields.reduce<Partial<UpdateProfileSchemaFormData>>(
      (acc, field) => {
        const newValue = formData[field];
        const oldValue = user[field as keyof Me];
        if (newValue !== oldValue) {
          (acc as Record<string, unknown>)[field] = newValue;
        }
        return acc;
      },
      {}
    );

    // Upload ảnh lên Firebase khi Save (nếu có file mới)
    if (formData.avatarFile) {
      try {
        setIsUploadingAvatar(true);
        // Compress ảnh trước khi upload
        const compressedFile = await compressImage(formData.avatarFile);
        const imageUrl = await uploadImageToFirebase(compressedFile, "avatars");
        updatedData.avatarUrl = imageUrl;
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
        setIsSaving(false);
        setIsUploadingAvatar(false);
        return;
      } finally {
        setIsUploadingAvatar(false);
      }
    } else if (
      formData.avatarUrl !== user.avatarUrl &&
      !avatarPreview.startsWith("data:")
    ) {
      // Avatar đã thay đổi và đã là URL Firebase
      updatedData.avatarUrl = formData.avatarUrl;
    }

    // Nếu có field nào thay đổi mới gọi API
    if (Object.keys(updatedData).length > 0) {
      try {
        await updateProfile(updatedData);
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (data) {
      setFormData(data as Me);
      setAvatarPreview(data.avatarUrl || "");
    }
    setIsEditing(false);
  };
  const handleResendVerifyEmail = () => {
    if (formData?.verify === "VERIFIED") {
      return;
    }
    resendVerifyEmail();
    setIsVerifyEmailModalOpen(true);
  };

  const handleVerifyEmailSubmit = async (otp: string) => {
    setIsVerifyingEmail(true);
    try {
      await verifyEmail({ otp });
      setIsVerifyEmailModalOpen(false);
    } finally {
      setIsVerifyingEmail(false);
    }
  };
  return (
    <div>
      <Profile
        user={user}
        formData={formData}
        handleAvatarChange={handleAvatarChange}
        handleInputChange={handleInputChange}
        handleResendVerifyEmail={handleResendVerifyEmail}
        handleUserAccountChange={handleUserAccountChange}
        setIsVerifyEmailModalOpen={setIsVerifyEmailModalOpen}
        handleSave={handleSave}
        isEditing={isEditing}
        isSaving={isSaving}
        setIsEditing={setIsEditing}
        avatarPreview={avatarPreview}
        handleCancel={handleCancel}
      />

      <VerifyEmailModal
        isOpen={isVerifyEmailModalOpen}
        onClose={() => setIsVerifyEmailModalOpen(false)}
        onSubmit={handleVerifyEmailSubmit}
        isLoading={isVerifyingEmail}
      />
    </div>
  );
}
