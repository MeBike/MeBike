import { AppHeroHeader } from "@ui/patterns/app-hero-header";

type BookingDetailHeaderProps = {
  title: string;
  onBackPress: () => void;
};

export default function BookingDetailHeader({
  title,
  onBackPress,
}: BookingDetailHeaderProps) {
  return <AppHeroHeader onBack={onBackPress} size="compact" title={title} />;
}
