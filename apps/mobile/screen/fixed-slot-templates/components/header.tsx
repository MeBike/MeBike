import { AppHeroHeader } from "@ui/patterns/app-hero-header";

type FixedSlotTemplatesHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export function FixedSlotTemplatesHeader({
  title,
  subtitle = "Quản lý các khung giờ giữ xe",
  onBack,
}: FixedSlotTemplatesHeaderProps) {
  return (
    <AppHeroHeader
      onBack={onBack}
      size="compact"
      subtitle={subtitle}
      title={title}
    />
  );
}
