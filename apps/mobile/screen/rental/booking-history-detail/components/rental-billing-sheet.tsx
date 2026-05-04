import { IconSymbol } from "@components/IconSymbol";
import { spaceScale } from "@theme/metrics";
import { AppBottomModalCard } from "@ui/patterns/app-bottom-modal-card";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { Separator, useTheme, XStack, YStack } from "tamagui";

import type { RentalBillingDetail, RentalBillingPreview, RentalStatus } from "@/types/rental-types";

import { formatCurrencyText } from "../helpers/formatters";

type BillingSheetData
  = | {
    data: RentalBillingPreview;
    mode: "preview";
  }
  | {
    data: RentalBillingDetail;
    mode: "detail";
  };

type RentalBillingSheetProps = {
  billing: BillingSheetData | null;
  bottomInset: number;
  onClose: () => void;
  rentalStatus: RentalStatus;
  visible: boolean;
};

type BillingRowProps = {
  amount: number;
  icon?: "tag" | "zap";
  label: string;
  tone?: "default" | "danger" | "success";
  sign?: "minus" | "plus";
};

function signedAmount(amount: number, sign?: BillingRowProps["sign"]) {
  if (sign === "minus") {
    return `-${formatCurrencyText(amount)}`;
  }

  if (sign === "plus") {
    return `+${formatCurrencyText(amount)}`;
  }

  return formatCurrencyText(amount);
}

function BillingRow({ amount, icon, label, sign, tone = "default" }: BillingRowProps) {
  const theme = useTheme();
  const amountTone = tone === "success" ? "success" : tone === "danger" ? "danger" : "default";

  return (
    <XStack alignItems="center" gap="$3" justifyContent="space-between">
      <XStack alignItems="center" flex={1} gap="$2">
        {icon
          ? <IconSymbol color={theme.textSuccess.val} name={icon} size="sm" />
          : null}
        <AppText flex={1} numberOfLines={1} tone="muted" variant="body">
          {label}
        </AppText>
      </XStack>
      <AppText tone={amountTone} variant="bodyStrong">
        {signedAmount(amount, sign)}
      </AppText>
    </XStack>
  );
}

function CouponRow({ billing }: { billing: BillingSheetData }) {
  if (billing.mode === "preview") {
    if (billing.data.couponDiscountAmount <= 0 || !billing.data.bestDiscountRule) {
      return null;
    }

    return (
      <BillingRow
        amount={billing.data.couponDiscountAmount}
        icon="zap"
        label={billing.data.bestDiscountRule.name}
        sign="minus"
        tone="success"
      />
    );
  }

  if (billing.data.couponDiscountAmount <= 0) {
    return null;
  }

  return (
    <BillingRow
      amount={billing.data.couponDiscountAmount}
      icon="tag"
      label={billing.data.couponRuleName ?? "Ưu đãi tự động"}
      sign="minus"
      tone="success"
    />
  );
}

export function RentalBillingSheet({ billing, bottomInset, onClose, rentalStatus, visible }: RentalBillingSheetProps) {
  const theme = useTheme();

  if (!billing) {
    return null;
  }

  const baseAmount = billing.mode === "preview"
    ? billing.data.baseRentalAmount
    : billing.data.baseAmount;
  const totalAmount = billing.mode === "preview"
    ? billing.data.totalPayableAmount
    : billing.data.totalAmount;
  const penaltyAmount = billing.mode === "preview" ? billing.data.penaltyAmount : 0;
  const isCurrentEstimate = billing.mode === "preview" && rentalStatus === "RENTED";
  const hasSubscriptionDiscount = billing.data.subscriptionApplied && billing.data.subscriptionDiscountAmount > 0;
  const hasDiscountSection = hasSubscriptionDiscount
    || (billing.mode === "preview"
      ? billing.data.couponDiscountAmount > 0 && Boolean(billing.data.bestDiscountRule)
      : billing.data.couponDiscountAmount > 0);

  return (
    <AppBottomModalCard isVisible={visible} onClose={onClose} variant="sheet">
      <YStack paddingBottom={Math.max(bottomInset, spaceScale[4])}>
        <YStack alignItems="center" paddingTop="$3">
          <YStack backgroundColor="$borderDefault" borderRadius="$round" height={4} width={42} />
        </YStack>

        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$6" paddingTop="$4">
          <AppText variant="sectionTitle">Chi tiết cước phí</AppText>
          <Pressable onPress={onClose}>
            <YStack
              alignItems="center"
              backgroundColor="$surfaceMuted"
              borderRadius="$round"
              height={36}
              justifyContent="center"
              width={36}
            >
              <IconSymbol color={theme.textSecondary.val} name="close" size="sm" />
            </YStack>
          </Pressable>
        </XStack>

        <YStack gap="$4" padding="$6">
          <YStack gap="$4">
            <BillingRow amount={baseAmount} label="Phí thuê xe" />
            {billing.data.prepaidAmount > 0
              ? (
                  <BillingRow
                    amount={billing.data.prepaidAmount}
                    label="Đã thanh toán trước"
                    sign="minus"
                  />
                )
              : null}
          </YStack>

          {hasDiscountSection
            ? (
                <>
                  <Separator borderColor="$borderSubtle" borderStyle="dashed" />
                  <YStack gap="$4">
                    {hasSubscriptionDiscount
                      ? (
                          <BillingRow
                            amount={billing.data.subscriptionDiscountAmount}
                            icon="zap"
                            label="Gói hội viên"
                            sign="minus"
                            tone="success"
                          />
                        )
                      : null}
                    <CouponRow billing={billing} />
                  </YStack>
                </>
              )
            : null}

          {penaltyAmount > 0
            ? (
                <>
                  <Separator borderColor="$borderSubtle" borderStyle="dashed" />
                  <BillingRow amount={penaltyAmount} label="Phụ phí / Phạt" sign="plus" tone="danger" />
                </>
              )
            : null}

          <Separator borderColor="$borderSubtle" borderStyle="dashed" />

          <XStack alignItems="flex-end" justifyContent="space-between">
            <YStack gap="$1">
              <AppText variant="headline">Tổng thanh toán</AppText>
              {isCurrentEstimate
                ? (
                    <AppText tone="muted" variant="eyebrow">
                      Tạm tính hiện tại
                    </AppText>
                  )
                : null}
            </YStack>
            <AppText variant="priceValue">
              {formatCurrencyText(totalAmount)}
            </AppText>
          </XStack>
        </YStack>
      </YStack>
    </AppBottomModalCard>
  );
}
