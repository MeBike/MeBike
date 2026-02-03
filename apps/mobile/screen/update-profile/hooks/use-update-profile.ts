import type { UserError } from "@services/users/user-error";
import type { UpdateMeRequest, UserDetail } from "@services/users/user-service";

import { zodResolver } from "@hookform/resolvers/zod";
import { uploadImageToFirebase } from "@lib/imageUpload";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { userService } from "@services/users/user-service";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import type { UpdateProfileNavigationProp } from "../../../types/navigation";
import type { TomTomAddressSuggestion } from "../lib/tomtom";
import type { UpdateProfileFormValues } from "../schema";

import { fetchTomTomAddressSuggest, fetchTomTomReverseGeocode } from "../lib/tomtom";
import { updateProfileSchema } from "../schema";

const LOCATION_SUGGEST_DELAY_MS = 500;

function buildUpdatePatch(params: {
  user: UserDetail;
  form: UpdateProfileFormValues;
  avatar: string;
}): Partial<UpdateMeRequest> {
  const { user, form, avatar } = params;
  const patch: Partial<UpdateMeRequest> = {};

  if (form.fullname !== (user.fullname ?? "")) {
    patch.fullname = form.fullname;
  }

  if ((form.username ?? "") !== (user.username ?? "")) {
    patch.username = form.username ?? "";
  }

  if (form.phoneNumber !== (user.phoneNumber ?? "")) {
    patch.phoneNumber = form.phoneNumber;
  }

  if ((form.location ?? "") !== (user.location ?? "")) {
    patch.location = form.location ?? "";
  }

  if ((avatar ?? "") !== (user.avatar ?? "")) {
    patch.avatar = avatar ?? "";
  }

  return patch;
}

function alertUpdateError(error: UserError) {
  if (error._tag === "ApiError") {
    Alert.alert("Lỗi", error.message ?? "Không thể cập nhật thông tin");
    return;
  }
  if (error._tag === "NetworkError") {
    Alert.alert("Lỗi", "Không thể kết nối tới máy chủ");
    return;
  }
  Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
}

export function useUpdateProfile() {
  const navigation = useNavigation<UpdateProfileNavigationProp>();
  const { user, hydrate, isLoading } = useAuthNext();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [addressSuggestions, setAddressSuggestions] = useState<TomTomAddressSuggestion[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultValues = useMemo<UpdateProfileFormValues>(() => ({
    fullname: user?.fullname ?? "",
    username: user?.username ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    location: user?.location ?? "",
  }), [user?.fullname, user?.location, user?.phoneNumber, user?.username]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaultValues);
    setAvatar(user?.avatar ?? "");
  }, [defaultValues, reset, user?.avatar]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    reset(defaultValues);
    setAvatar(user?.avatar ?? "");
    setAddressSuggestions([]);
    setIsEditing(false);
  }, [defaultValues, reset, user?.avatar]);

  const pickAvatar = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setIsUploadingAvatar(true);
      const uploadedUrl = await uploadImageToFirebase(result.assets[0]);
      setAvatar(uploadedUrl);
      Alert.alert("Thành công", "Ảnh đã được upload!");
    }
    catch {
      Alert.alert("Lỗi", "Upload ảnh thất bại. Vui lòng thử lại.");
    }
    finally {
      setIsUploadingAvatar(false);
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
      Alert.alert("Lỗi", "Không tìm thấy thông tin tài khoản");
      return;
    }

    const changedData = buildUpdatePatch({ user, form: data, avatar });

    if (Object.keys(changedData).length === 0) {
      Alert.alert("Không có thay đổi", "Bạn chưa thay đổi thông tin nào.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await userService.updateMe(changedData);
      if (!result.ok) {
        alertUpdateError(result.error);
        return;
      }

      await hydrate();
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
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

    avatar,
    pickAvatar,
    isUploadingAvatar,

    addressSuggestions,
    selectSuggestion,
    setLocation,
  };
}
