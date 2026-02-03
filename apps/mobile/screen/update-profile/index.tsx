import { BikeColors } from "@constants/BikeColors";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";

import { UpdateProfileForm } from "./components/update-profile-form";
import { UpdateProfileHeader } from "./components/update-profile-header";
import { useUpdateProfile } from "./hooks/use-update-profile";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 8,
    paddingBottom: 24,
    overflow: "hidden",
  },
});

export default function UpdateProfileScreen() {
  const {
    user,
    isLoading,
    isEditing,
    startEdit,
    cancelEdit,
    submit,
    goBack,
    control,
    errors,
    avatar,
    pickAvatar,
    isUploadingAvatar,
    isSaving,
    addressSuggestions,
    selectSuggestion,
    setLocation,
  } = useUpdateProfile();

  if (isLoading && !user) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={BikeColors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <UpdateProfileHeader
          onBack={goBack}
          onPrimaryAction={isEditing ? submit : startEdit}
          isEditing={isEditing}
          isBusy={isSaving}
          avatarUrl={avatar}
          onPickAvatar={pickAvatar}
          isUploadingAvatar={isUploadingAvatar}
        />
        <View style={styles.body}>
          <UpdateProfileForm
            control={control}
            errors={errors}
            email={user?.email ?? ""}
            isEditing={isEditing}
            isSaving={isSaving}
            onSubmit={submit}
            onCancel={cancelEdit}
            onLocationChange={setLocation}
            locationSuggestions={addressSuggestions}
            onSelectLocationSuggestion={selectSuggestion}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
