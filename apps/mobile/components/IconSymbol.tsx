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
  Hash,
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

type IconConfig = {
  fill?: boolean;
  icon: LucideIconComponent;
  strokeWidth?: number;
};

const ICONS = {
  "arrow.clockwise": { icon: RefreshCw },
  "arrow.down": { icon: ArrowDown },
  "arrow.left": { icon: ArrowLeft },
  "arrow.right": { icon: ArrowRight },
  "arrow.up": { icon: ArrowUp },
  "bell": { icon: Bell },
  "bicycle": { icon: Bike },
  "bicycle.circle.fill": { icon: Bike },
  "building.2.fill": { icon: Building2 },
  "calendar": { icon: Calendar },
  "checkmark": { icon: Check },
  "checkmark.circle": { icon: CheckCircle2 },
  "checkmark.circle.fill": { icon: CheckCircle2 },
  "chevron.right": { icon: ChevronRight },
  "circle": { icon: Circle },
  "clock": { icon: Clock },
  "clock.fill": { icon: Clock },
  "cpu": { icon: Cpu },
  "creditcard": { icon: CreditCard },
  "creditcard.fill": { icon: CreditCard },
  "doc.on.doc": { icon: Copy },
  "doc.text": { icon: FileText },
  "envelope": { icon: Mail },
  "eye": { icon: Eye },
  "eye.slash": { icon: EyeOff },
  "exclamationmark.triangle": { icon: TriangleAlert },
  "exclamationmark.triangle.fill": { icon: TriangleAlert, fill: true },
  "house.fill": { icon: Home, fill: true },
  "info.circle": { icon: Info },
  "location": { icon: MapPin },
  "location.fill": { icon: MapPin, fill: true },
  "lock": { icon: Lock },
  "lock.shield.fill": { icon: Shield, fill: true },
  "magnifyingglass": { icon: Search },
  "map": { icon: Map },
  "number": { icon: Hash },
  "person": { icon: User },
  "person.crop.circle.fill": { icon: CircleUserRound, fill: true },
  "person.fill": { icon: User, fill: true },
  "phone": { icon: Phone },
  "phone.fill": { icon: Phone, fill: true },
  "play.fill": { icon: Play, fill: true, strokeWidth: 1.8 },
  "plus": { icon: Plus },
  "qrcode.viewfinder": { icon: QrCode },
  "slider.horizontal.3": { icon: SlidersHorizontal },
  "star": { icon: Star },
  "star.fill": { icon: Star, fill: true, strokeWidth: 1.8 },
  "tag": { icon: Tag },
  "timer": { icon: Timer },
  "wallet.pass.fill": { icon: Wallet },
  "wrench.and.screwdriver.fill": { icon: Wrench, fill: true },
  "xmark": { icon: X },
} as const satisfies Record<string, IconConfig>;

export type IconSymbolName = keyof typeof ICONS;
export type IconSymbolSizeToken = keyof typeof iconSizes;
export type IconSymbolSizeValue = (typeof iconSizes)[IconSymbolSizeToken];
export type IconSymbolSize = IconSymbolSizeToken | IconSymbolSizeValue;

export type IconSymbolProps = {
  color: ColorValue;
  name: IconSymbolName;
  size?: IconSymbolSize;
  style?: StyleProp<ViewStyle>;
};

function resolveIconSize(size: IconSymbolSize = "lg") {
  return typeof size === "number" ? size : iconSizes[size];
}

export function IconSymbol({
  name,
  size = "lg",
  color,
  style,
}: IconSymbolProps) {
  const config: IconConfig = ICONS[name];
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
