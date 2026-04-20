import { Check, ShieldAlert, TriangleAlert, XCircle } from "lucide-react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { AiAssistantActionCard } from "@services/ai";

import { borderWidths, iconSizes, radii } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

const ACTION_CARD_MAX_WIDTH = 360;

function getActionCardAccent(state: AiAssistantActionCard["state"]) {
  switch (state) {
    case "success":
      return {
        borderColor: "$borderSubtle" as const,
        iconBackgroundColor: "$statusSuccessSoft" as const,
        iconColorKey: "statusSuccess" as const,
        subtitleTone: "subtle" as const,
        titleTone: "default" as const,
      };
    case "failure":
    case "denied":
      return {
        borderColor: "$borderSubtle" as const,
        iconBackgroundColor: "$statusDangerSoft" as const,
        iconColorKey: "statusDanger" as const,
        subtitleTone: "subtle" as const,
        titleTone: "danger" as const,
      };
    default:
      return {
        borderColor: "$borderFocus" as const,
        iconBackgroundColor: "$surfaceAccent" as const,
        iconColorKey: "actionPrimary" as const,
        subtitleTone: "subtle" as const,
        titleTone: "default" as const,
      };
  }
}

function getActionCardStateLabel(state: AiAssistantActionCard["state"]) {
  switch (state) {
    case "approval":
      return "Yêu cầu xác nhận";
    case "success":
      return "Thực hiện thành công";
    case "failure":
      return "Không thể thực hiện";
    case "denied":
      return "Đã từ chối";
    default:
      return "Trạng thái thao tác";
  }
}

function getActionCardStateSubtitle(state: AiAssistantActionCard["state"]) {
  switch (state) {
    case "approval":
      return "Quyền thực thi hệ thống";
    case "success":
      return "Hệ thống đã cập nhật";
    case "failure":
      return "Hệ thống chưa thực hiện được";
    case "denied":
      return "Không có thay đổi nào được thực hiện";
    default:
      return "Trạng thái thao tác";
  }
}

function ActionCardIcon({ state }: { state: AiAssistantActionCard["state"] }) {
  const theme = useTheme();
  const accent = getActionCardAccent(state);
  const color = theme[accent.iconColorKey].val;

  if (state === "success") {
    return <Check color={color} size={iconSizes.md} />;
  }

  if (state === "failure") {
    return <TriangleAlert color={color} size={iconSizes.md} />;
  }

  if (state === "denied") {
    return <XCircle color={color} size={iconSizes.md} />;
  }

  return <ShieldAlert color={color} size={iconSizes.md} />;
}

function ActionCardSummary({ items }: { items: AiAssistantActionCard["summaryItems"] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <YStack
      backgroundColor="$surfaceSubtle"
      borderColor="$borderSubtle"
      borderRadius={radii.lg}
      borderWidth={borderWidths.subtle}
      gap="$3"
      padding="$4"
      width="100%"
    >
      {items.map(item => (
        <XStack alignItems="center" gap="$4" justifyContent="space-between" key={`${item.label}:${item.value}`}>
          <AppText flexShrink={0} minWidth={84} tone="subtle" variant="bodySmall">
            {item.label}
          </AppText>
          <AppText align="right" flex={1} minWidth={0} variant="bodyStrong">
            {item.value}
          </AppText>
        </XStack>
      ))}
    </YStack>
  );
}

function ActionCardHeader({ card }: { card: AiAssistantActionCard }) {
  const accent = getActionCardAccent(card.state);

  return (
    <XStack alignItems="center" gap="$3">
      <XStack
        alignItems="center"
        backgroundColor={accent.iconBackgroundColor}
        borderRadius="$round"
        height={iconSizes.display}
        justifyContent="center"
        width={iconSizes.display}
      >
        <ActionCardIcon state={card.state} />
      </XStack>

      <YStack flex={1} gap="$1" minWidth={0}>
        <AppText tone={accent.titleTone} variant="sectionTitle">
          {getActionCardStateLabel(card.state)}
        </AppText>
        <AppText tone={accent.subtitleTone} variant="bodySmall">
          {getActionCardStateSubtitle(card.state)}
        </AppText>
      </YStack>
    </XStack>
  );
}

function ApprovalActionToolCard({
  approvalBusy,
  card,
  onApprove,
  onDeny,
}: {
  approvalBusy: boolean;
  card: AiAssistantActionCard;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}) {
  const accent = getActionCardAccent(card.state);

  if (!card.approvalId) {
    return null;
  }

  return (
    <AppCard
      alignSelf="flex-start"
      backgroundColor="$surfaceDefault"
      borderColor={accent.borderColor}
      borderRadius={radii.xxl}
      borderTopLeftRadius={radii.sm}
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      maxWidth={ACTION_CARD_MAX_WIDTH}
      padding="$4"
      width="100%"
    >
      <ActionCardHeader card={card} />

      <ActionCardSummary items={card.summaryItems} />

      <XStack gap="$3">
        <AppButton
          backgroundColor="$surfaceSubtle"
          borderColor="$surfaceSubtle"
          buttonSize="large"
          disabled={approvalBusy}
          flex={1}
          onPress={() => onDeny(card.approvalId!)}
          shadowOpacity={0}
          tone="ghost"
        >
          <AppText tone="muted" variant="bodyStrong">
            Hủy bỏ
          </AppText>
        </AppButton>

        <AppButton
          buttonSize="large"
          disabled={approvalBusy}
          flex={1}
          onPress={() => onApprove(card.approvalId!)}
          tone="primary"
        >
          <XStack alignItems="center" gap="$2">
            <Check color="white" size={iconSizes.sm} />
            <AppText tone="inverted" variant="bodyStrong">
              Xác nhận
            </AppText>
          </XStack>
        </AppButton>
      </XStack>
    </AppCard>
  );
}

function ActionResultCard({ card }: { card: AiAssistantActionCard }) {
  const accent = getActionCardAccent(card.state);

  return (
    <AppCard
      alignSelf="flex-start"
      backgroundColor="$surfaceDefault"
      borderColor={accent.borderColor}
      borderRadius={radii.xxl}
      borderTopLeftRadius={radii.sm}
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      maxWidth={ACTION_CARD_MAX_WIDTH}
      padding="$4"
      width="100%"
    >
      <ActionCardHeader card={card} />

      <YStack gap="$2">
        <AppText variant="sectionTitle">{card.title}</AppText>
        {card.description
          ? <AppText variant="bodySmall">{card.description}</AppText>
          : null}
      </YStack>

      <ActionCardSummary items={card.summaryItems} />
    </AppCard>
  );
}

export function ActionToolCard({
  approvalBusy,
  card,
  onApprove,
  onDeny,
}: {
  approvalBusy: boolean;
  card: AiAssistantActionCard;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}) {
  if (card.state === "approval") {
    return (
      <ApprovalActionToolCard
        approvalBusy={approvalBusy}
        card={card}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );
  }

  return <ActionResultCard card={card} />;
}
