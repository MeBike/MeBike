import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { IconSymbol } from "@components/IconSymbol";
import DateTimePicker from "@react-native-community/datetimepicker";
import { borderWidths } from "@theme/metrics";
import { AppBottomModalCard } from "@ui/patterns/app-bottom-modal-card";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Pressable, ScrollView } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { QuickHistoryRangeOption } from "../hooks/use-environment-impact-screen";

function formatFilterDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

type EnvironmentHistoryFilterSheetProps = {
  activeDateField: "from" | "to";
  draftRange: "all" | "last7Days" | "thisMonth" | "custom";
  draftCustomRange: {
    from: Date;
    to: Date;
  };
  isVisible: boolean;
  onClose: () => void;
  onApply: () => void;
  onChangeDate: (field: "from" | "to", date: Date) => void;
  onSelect: (key: "all" | "last7Days" | "thisMonth" | "custom") => void;
  onSelectDateField: (field: "from" | "to") => void;
  options: ReadonlyArray<QuickHistoryRangeOption>;
};

export function EnvironmentHistoryFilterSheet({
  activeDateField,
  draftRange,
  draftCustomRange,
  isVisible,
  onClose,
  onApply,
  onChangeDate,
  onSelect,
  onSelectDateField,
  options,
}: EnvironmentHistoryFilterSheetProps) {
  const theme = useTheme();
  const pickerValue = activeDateField === "from" ? draftCustomRange.from : draftCustomRange.to;
  const resolvedOptions = [
    ...options,
    {
      key: "custom" as const,
      label: "Tùy chỉnh khoảng ngày",
      description: "Chọn ngày bắt đầu và kết thúc theo ý muốn.",
    },
  ];

  return (
    <AppBottomModalCard
      isVisible={isVisible}
      maxHeight="82%"
      onClose={onClose}
      variant="sheet"
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" padding="$5">
          <XStack alignItems="center" justifyContent="center" paddingTop="$1">
            <YStack backgroundColor="$backgroundSubtle" borderRadius="$round" height={6} width={80} />
          </XStack>

          <XStack alignItems="center" justifyContent="space-between">
            <AppText variant="xlTitle">
              Lọc theo thời gian
            </AppText>

            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
              <XStack
                alignItems="center"
                backgroundColor="$surfaceMuted"
                borderRadius="$round"
                height={44}
                justifyContent="center"
                width={44}
              >
                <IconSymbol color={theme.textSecondary.val} name="close" size="md" />
              </XStack>
            </Pressable>
          </XStack>

          <YStack gap="$3">
            {resolvedOptions.map((option) => {
              const isActive = draftRange === option.key;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
                >
                  <AppCard
                    borderColor={isActive ? "$statusSuccess" : "$borderSubtle"}
                    borderRadius="$5"
                    borderWidth={borderWidths.subtle}
                    chrome="flat"
                    tone={isActive ? "accent" : "default"}
                    padding="$4"
                  >
                    <XStack alignItems="center" gap="$3" justifyContent="space-between">
                      <YStack flex={1} gap="$1">
                        <AppText variant="sectionTitle">
                          {option.label}
                        </AppText>
                        {option.key === "custom"
                          ? (
                              <AppText tone="muted" variant="bodySmall">
                                {formatFilterDate(draftCustomRange.from)}
                                {" "}
                                -
                                {formatFilterDate(draftCustomRange.to)}
                              </AppText>
                            )
                          : null}
                      </YStack>
                      <XStack
                        alignItems="center"
                        backgroundColor={isActive ? "$surfaceSuccess" : "$surfaceDefault"}
                        borderColor={isActive ? "$statusSuccess" : "$borderSubtle"}
                        borderRadius="$round"
                        borderWidth={borderWidths.subtle}
                        height={36}
                        justifyContent="center"
                        width={36}
                      >
                        <IconSymbol
                          color={isActive ? theme.statusSuccess.val : theme.textDisabled.val}
                          name={isActive ? "check-circle" : "circle"}
                          size="sm"
                        />
                      </XStack>
                    </XStack>
                  </AppCard>
                </Pressable>
              );
            })}
          </YStack>

          {draftRange === "custom"
            ? (
                <YStack gap="$3">
                  <XStack gap="$3">
                    <Pressable
                      onPress={() => onSelectDateField("from")}
                      style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, flex: 1 })}
                    >
                      <AppCard
                        borderColor={activeDateField === "from" ? "$borderFocus" : "$borderSubtle"}
                        borderRadius="$4"
                        borderWidth={borderWidths.subtle}
                        chrome="flat"
                        tone={activeDateField === "from" ? "accent" : "default"}
                      >
                        <YStack gap="$1">
                          <AppText tone="subtle" variant="eyebrow">
                            Từ ngày
                          </AppText>
                          <AppText variant="cardTitle">
                            {formatFilterDate(draftCustomRange.from)}
                          </AppText>
                        </YStack>
                      </AppCard>
                    </Pressable>

                    <Pressable
                      onPress={() => onSelectDateField("to")}
                      style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, flex: 1 })}
                    >
                      <AppCard
                        borderColor={activeDateField === "to" ? "$borderFocus" : "$borderSubtle"}
                        borderRadius="$4"
                        borderWidth={borderWidths.subtle}
                        chrome="flat"
                        tone={activeDateField === "to" ? "accent" : "default"}
                      >
                        <YStack gap="$1">
                          <AppText tone="subtle" variant="eyebrow">
                            Đến ngày
                          </AppText>
                          <AppText variant="cardTitle">
                            {formatFilterDate(draftCustomRange.to)}
                          </AppText>
                        </YStack>
                      </AppCard>
                    </Pressable>
                  </XStack>

                  <AppCard
                    borderColor="$borderSubtle"
                    borderRadius="$5"
                    borderWidth={borderWidths.subtle}
                    chrome="flat"
                    padding="$4"
                  >
                    <YStack gap="$2">
                      <XStack alignItems="center" gap="$2">
                        <IconSymbol color={theme.textBrand.val} name="calendar" size="sm" />
                        <AppText variant="cardTitle">
                          {activeDateField === "from" ? "Chọn ngày bắt đầu" : "Chọn ngày kết thúc"}
                        </AppText>
                      </XStack>

                      <DateTimePicker
                        accentColor={theme.actionPrimary.val}
                        display="spinner"
                        mode="date"
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          if (event.type === "dismissed" || !date) {
                            return;
                          }

                          onChangeDate(activeDateField, date);
                        }}
                        value={pickerValue}
                      />
                    </YStack>
                  </AppCard>
                </YStack>
              )
            : null}

          <AppButton onPress={onApply} tone="primary">
            Áp dụng bộ lọc
          </AppButton>
        </YStack>
      </ScrollView>
    </AppBottomModalCard>
  );
}
