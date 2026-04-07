import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import type { UpdateMeRequest, UploadAvatarPayload } from "@services/users/user-service";

import {
  presentUpdateProfileFieldError,
  presentUserError,
} from "@/presenters/users/user-error-presenter";
import { useAuthNext } from "@providers/auth-provider-next";
import { userService } from "@services/users/user-service";

import type { UpdateProfileNavigationProp } from "../../../../types/navigation";
import type { TomTomAddressSuggestion } from "../lib/tomtom";
import type { UpdateProfileFormValues } from "../schema";

import { fetchTomTomAddressSuggest, fetchTomTomReverseGeocode } from "../lib/tomtom";
import { updateProfileSchema } from "../schema";

const LOCATION_SUGGEST_DELAY_MS = 500;

function buildUpdatePatch(params: {
  form: UpdateProfileFormValues;
  dirtyFields: Partial<Record<keyof UpdateProfileFormValues, boolean | undefined>>;
}): Partial<UpdateMeRequest> {
  const { form, dirtyFields } = params;
  const patch: Partial<UpdateMeRequest> = {};

  if (dirtyFields.fullname) {
    patch.fullname = form.fullname;
  }

  if (dirtyFields.username) {
    patch.username = form.username ?? "";
  }

  if (dirtyFields.phoneNumber) {
    patch.phoneNumber = form.phoneNumber;
  }

  if (dirtyFields.location) {
    patch.location = form.location ?? "";
  }

  return patch;
}

function createAvatarUploadPayload(asset: ImagePicker.ImagePickerAsset): UploadAvatarPayload {
  const extension = asset.fileName?.split(".").pop() ?? asset.mimeType?.split("/").pop() ?? "jpg";

  return {
    uri: asset.uri,
    name: asset.fileName ?? `avatar.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  };
}

export function useUpdateProfile() {
  const navigation = useNavigation<UpdateProfileNavigationProp>();
  const { user, hydrate, isLoading } = useAuthNext();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<UploadAvatarPayload | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<TomTomAddressSuggestion[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultValues = useMemo<UpdateProfileFormValues>(() => ({
    fullname: user?.fullName ?? "",
    username: user?.username ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    location: user?.location ?? "",
  }), [user?.fullName, user?.location, user?.phoneNumber, user?.username]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { dirtyFields, errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  const clearPendingAvatar = useCallback(() => {
    setPendingAvatar(null);
    setPendingAvatarPreview(null);
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    reset(defaultValues);
    clearPendingAvatar();
    setAddressSuggestions([]);
    setIsEditing(false);
  }, [clearPendingAvatar, defaultValues, reset]);

  const pickAvatar = useCallback(async () => {
    try {
      setIsPickingAvatar(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setPendingAvatar(createAvatarUploadPayload(asset));
      setPendingAvatarPreview(asset.uri);
      Alert.alert("Đã chọn ảnh mới", "Ảnh đại diện sẽ được cập nhật khi bạn lưu thay đổi.");
    }
    catch {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh. Vui lòng thử lại.");
    }
    finally {
      setIsPickingAvatar(false);
    }
  }, []);

  const setLocation = useCallback((value: string) => {
    setValue("location", value, { shouldDirty: true });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    if (value.trim().length <= 3) {
      setAddressSuggestions([]);
      return;
    }

    typingTimeout.current = setTimeout(async () => {
      const suggestions = await fetchTomTomAddressSuggest(value);
      setAddressSuggestions(suggestions);
    }, LOCATION_SUGGEST_DELAY_MS);
  }, [setValue]);

  const selectSuggestion = useCallback(async (item: TomTomAddressSuggestion) => {
    setAddressSuggestions([]);
    const resolved = await fetchTomTomReverseGeocode(
      item.latitude.toString(),
      item.longitude.toString(),
    );
    setValue("location", resolved || item.address, { shouldDirty: true });
  }, [setValue]);

  const submit = handleSubmit(async (data) => {
    if (!user) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin tài khoản.");
      return;
    }

    const changedData = buildUpdatePatch({ dirtyFields, form: data });
    const hasProfileChanges = Object.keys(changedData).length > 0;
    const hasAvatarChange = pendingAvatar !== null;

    if (!hasProfileChanges && !hasAvatarChange) {
      Alert.alert("Không có thay đổi", "Bạn chưa thay đổi thông tin nào.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      if (hasProfileChanges) {
        const profileResult = await userService.updateMe(changedData);
        if (!profileResult.ok) {
          const fieldError = presentUpdateProfileFieldError(profileResult.error);
          if (fieldError) {
            setError(fieldError.field, { message: fieldError.message });
            return;
          }

          Alert.alert("Lỗi", presentUserError(profileResult.error, "Không thể cập nhật thông tin."));
          return;
        }
      }

      if (pendingAvatar) {
        const avatarResult = await userService.uploadMyAvatar(pendingAvatar);
        if (!avatarResult.ok) {
          if (hasProfileChanges) {
            await hydrate();
          }

          Alert.alert(
            "Lỗi",
            hasProfileChanges
              ? `Đã lưu thông tin hồ sơ, nhưng chưa thể cập nhật ảnh đại diện. ${presentUserError(avatarResult.error)}`
              : presentUserError(avatarResult.error, "Không thể cập nhật ảnh đại diện."),
          );
          return;
        }
      }

      clearPendingAvatar();
      setAddressSuggestions([]);
      await hydrate();
      setIsEditing(false);

      Alert.alert(
        "Thành công",
        hasProfileChanges && hasAvatarChange
          ? "Đã cập nhật hồ sơ và ảnh đại diện."
          : hasAvatarChange
            ? "Đã cập nhật ảnh đại diện."
            : "Đã cập nhật thông tin hồ sơ.",
      );
    }
    finally {
      setIsSaving(false);
    }
  });

  return {
    user,
    isLoading,
    isEditing,
    isSaving,
    startEdit,
    cancelEdit,
    submit,
    goBack,

    control,
    errors,

    avatar: pendingAvatarPreview ?? user?.avatar ?? "",
    pickAvatar,
    isPickingAvatar,
    hasPendingAvatar: pendingAvatar !== null,

    addressSuggestions,
    selectSuggestion,
    setLocation,
  };
}
