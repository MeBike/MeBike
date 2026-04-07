/* eslint-disable unicorn/filename-case */

import type { ColorValue, StyleProp, ViewStyle } from "react-native";

import { iconSizes } from "@theme/metrics";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  Bike,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleUserRound,
  Clock,
  Copy,
  Cpu,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Home,
  Info,
  Lock,
  Mail,
  Map,
  MapPin,
  Phone,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Star,
  Tag,
  Timer,
  TriangleAlert,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react-native";
import React from "react";

type LucideIconComponent = typeof ArrowLeft;

type IconRenderConfig = {
  fill?: boolean;
  icon: LucideIconComponent;
  strokeWidth?: number;
};

type IconVariantConfig = {
  filled?: IconRenderConfig;
  outline: IconRenderConfig;
};

const ICONS = {
  "arrow-down": { outline: { icon: ArrowDown } },
  "arrow-left": { outline: { icon: ArrowLeft } },
  "arrow-right": { outline: { icon: ArrowRight } },
  "arrow-up": { outline: { icon: ArrowUp } },
  "bell": { outline: { icon: Bell } },
  "bike": { outline: { icon: Bike } },
  "calendar": { outline: { icon: Calendar } },
  "check": { outline: { icon: Check } },
  "check-circle": { outline: { icon: CheckCircle2 } },
  "chevron-right": { outline: { icon: ChevronRight } },
  "chip": { outline: { icon: Cpu } },
  "circle": { outline: { icon: Circle }, filled: { icon: Circle, fill: true } },
  "clock": { outline: { icon: Clock } },
  "close": { outline: { icon: X } },
  "copy": { outline: { icon: Copy } },
  "credit-card": { outline: { icon: CreditCard } },
  "document": { outline: { icon: FileText } },
  "eye": { outline: { icon: Eye } },
  "eye-off": { outline: { icon: EyeOff } },
  "home": { outline: { icon: Home }, filled: { icon: Home, fill: true } },
  "info": { outline: { icon: Info } },
  "location": { outline: { icon: MapPin }, filled: { icon: MapPin, fill: true } },
  "lock": { outline: { icon: Lock } },
  "mail": { outline: { icon: Mail } },
  "map": { outline: { icon: Map } },
  "person": { outline: { icon: User } },
  "person-circle": { outline: { icon: CircleUserRound }, filled: { icon: CircleUserRound, fill: true } },
  "phone": { outline: { icon: Phone }, filled: { icon: Phone, fill: true } },
  "play": { outline: { icon: Play, strokeWidth: 1.8 } },
  "plus": { outline: { icon: Plus } },
  "qr-code": { outline: { icon: QrCode } },
  "refresh": { outline: { icon: RefreshCw } },
  "search": { outline: { icon: Search } },
  "shield-lock": { outline: { icon: Shield } },
  "sliders": { outline: { icon: SlidersHorizontal } },
  "star": { outline: { icon: Star }, filled: { icon: Star, fill: true, strokeWidth: 1.8 } },
  "station": { outline: { icon: Building2 } },
  "tag": { outline: { icon: Tag } },
  "timer": { outline: { icon: Timer } },
  "tools": { outline: { icon: Wrench } },
  "wallet": { outline: { icon: Wallet } },
  "warning": { outline: { icon: TriangleAlert }, filled: { icon: TriangleAlert, fill: true } },
} as const satisfies Record<string, IconVariantConfig>;

type IconRegistry = typeof ICONS;

export type IconSymbolName = keyof IconRegistry;
export type IconSymbolVariant = "outline" | "filled";
export type IconSymbolSize = keyof typeof iconSizes;
export type IconSymbolProps = {
  color: ColorValue;
  name: IconSymbolName;
  size?: IconSymbolSize;
  style?: StyleProp<ViewStyle>;
  variant?: IconSymbolVariant;
};

function resolveIconSize(size: IconSymbolSize = "lg") {
  return iconSizes[size];
}

function resolveIconConfig(name: IconSymbolName, variant: IconSymbolVariant): IconRenderConfig {
  const config: IconVariantConfig = ICONS[name];

  if (variant === "filled" && config.filled) {
    return config.filled;
  }

  return config.outline;
}

export function IconSymbol({
  color,
  name,
  size = "lg",
  style,
  variant = "outline",
}: IconSymbolProps) {
  const config = resolveIconConfig(name, variant);
  const Icon = config.icon;
  const fill = config.fill ?? false;
  const strokeWidth = config.strokeWidth ?? 2.2;

  return (
    <Icon
      absoluteStrokeWidth
      color={color as string}
      fill={fill ? color as string : "none"}
      size={resolveIconSize(size)}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
