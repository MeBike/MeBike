
import { useMemo , useState} from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { UpdateProfileSchemaFormData } from "@schemas/authSchema";
import { useAuth } from "@providers/auth-providers";
import type { DetailUser } from "@services/authService";

const UpdateProfileScreen = ({ navigation }: any) => {

  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const initialProfile = useMemo<UpdateProfileSchemaFormData>(() => ({
    fullname: user?.fullname || "",
    username: user?.username || "",
    phone_number: user?.phone_number || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
  }), [user]);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<UpdateProfileSchemaFormData>({
    defaultValues: initialProfile,
    mode: "onChange",
  });
  const [isEditing, setIsEditing] = useState(false);


  const handleEditPress = () => {
    setIsEditing(true);
    reset(getValues());
  };


  // const onSubmit = async (data: UpdateProfileSchemaFormData) => {
  //   if (!data.fullname.trim()) {
  //     Alert.alert("Lỗi", "Vui lòng nhập họ tên");
  //     return;
  //   }
  //   if (!data.phone_number?.trim()) {
  //     Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
  //     return;
  //   }
  //   if (!isDirty) {
  //     Alert.alert("Không có thay đổi", "Bạn chưa thay đổi thông tin nào.");
  //     setIsEditing(false);
  //     return;
  //   }
  //   try {
  //     await updateProfile(data);
  //     reset(data);
  //     setIsEditing(false);
  //     Alert.alert("Thành công", "Cập nhật thông tin thành công");
  //   } catch (e) {
  //     Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
  //   }
  // };

const onSubmit = async (data: UpdateProfileSchemaFormData) => {
  if (!data.fullname.trim()) {
    Alert.alert("Lỗi", "Vui lòng nhập họ tên");
    return;
  }
  if (!data.phone_number?.trim()) {
    Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
    return;
  }
  if (!isDirty) {
    Alert.alert("Không có thay đổi", "Bạn chưa thay đổi thông tin nào.");
    setIsEditing(false);
    return;
  }
  const changedData: Partial<UpdateProfileSchemaFormData> = {};
  const dirtyFieldKeys = Object.keys(dirtyFields) as Array<
    keyof UpdateProfileSchemaFormData
  >;
  for (const key of dirtyFieldKeys) {
    changedData[key] = data[key];
  }


  try {
    updateProfile(changedData); 
    reset(data);
    setIsEditing(false);

  } catch (e) {
    Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
  }
};
  const handleCancel = () => {
    reset(initialProfile);
    setIsEditing(false);
  };


  // Render all fields from DetailUser, only allow editing for UpdateProfileSchemaFormData fields
  const detailUserFields: Array<{ key: keyof DetailUser; label: string; icon: string; editable?: boolean; keyboardType?: "default" | "email-address" | "phone-pad" }> = [
    { key: "fullname", label: "Họ và tên", icon: "person", editable: true },
    { key: "username", label: "Username", icon: "person", editable: true },
    { key: "email", label: "Email", icon: "mail", editable: false, keyboardType: "email-address" },
    { key: "phone_number", label: "Điện thoại", icon: "call", editable: true, keyboardType: "phone-pad" },
    { key: "location", label: "Địa chỉ", icon: "location", editable: true },
    { key: "avatar", label: "Avatar", icon: "image", editable: true },
    { key: "role", label: "Vai trò", icon: "shield", editable: false },
    { key: "verify", label: "Trạng thái xác thực", icon: "checkmark", editable: false },
    { key: "created_at", label: "Ngày tạo", icon: "calendar", editable: false },
    { key: "updated_at", label: "Ngày cập nhật", icon: "calendar", editable: false },
    { key: "_id", label: "ID", icon: "key", editable: false },
  ];

  const renderInputField = (
    key: keyof DetailUser,
    label: string,
    icon: string,
    editable: boolean = false,
    keyboardType: "default" | "email-address" | "phone-pad" = "default"
  ) => {
    // Only allow editing for fields in UpdateProfileSchemaFormData
    const isFormField = ["fullname", "username", "phone_number", "location", "avatar"].includes(key);
    if (isFormField) {
      return (
        <Controller
          control={control}
          name={key as keyof UpdateProfileSchemaFormData}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name={icon as any}
                  size={18}
                  color="#0066FF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={isEditing && editable}
                  placeholderTextColor="#ccc"
                  keyboardType={keyboardType}
                />
              </View>
            </View>
          )}
        />
      );
    } else {
      // Show as disabled input, value from user object
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name={icon as any}
              size={18}
              color="#0066FF"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.[key] ? String(user[key]) : ""}
              editable={false}
              // placeholderTextColor="#ccc"
              keyboardType={keyboardType}
            />
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      {/* Header */}
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
          <View style={{ width: 28 }} />
        </View>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Controller
            control={control}
            name="avatar"
            render={({ field: { value } }) => (
              <Image source={{ uri: value }} style={styles.avatar} />
            )}
          />
          {isEditing && (
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Form Fields */}
        <View style={styles.formSection}>
          {detailUserFields.map((field) =>
            renderInputField(
              field.key,
              field.label,
              field.icon,
              field.editable ?? false,
              field.keyboardType ?? "default"
            )
          )}
        </View>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditPress}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit(onSubmit)}
                disabled={isUpdatingProfile}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.buttonText}>
                  {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isUpdatingProfile}
              >
                <Ionicons name="close" size={18} color="#0066FF" />
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.infoText}>
          Cập nhật thông tin cá nhân của bạn để có trải nghiệm tốt hơn
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#FF6B6B",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 12,
  },
  inputDisabled: {
    color: "#666",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B050",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0066FF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#0066FF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
});

export default UpdateProfileScreen;
