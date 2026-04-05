import type { OpaqueColorValue, StyleProp, ViewStyle } from "react-native";

import {
  AlertTriangle,
  CheckCircle2,
  CircleUserRound,
  Clock,
  Copy,
  Map as MapIcon,
  MapPin,
  QrCode,
  Shield,
  Wallet,
  Wrench,
} from "lucide-react-native";
import React from "react";

const MAPPING = {
  "checkmark.circle.fill": { icon: CheckCircle2, filled: false },
  "clock": { icon: Clock, filled: false },
  "doc.on.doc": { icon: Copy, filled: false },
  "exclamationmark.triangle": { icon: AlertTriangle, filled: false },
  "lock.shield.fill": { icon: Shield, filled: false },
  "location": { icon: MapPin, filled: false },
  "location.fill": { icon: MapPin, filled: true },
  "map": { icon: MapIcon, filled: false },
  "person.crop.circle.fill": { icon: CircleUserRound, filled: false },
  "qrcode.viewfinder": { icon: QrCode, filled: false },
  "wallet.pass.fill": { icon: Wallet, filled: false },
  "wrench.and.screwdriver.fill": { icon: Wrench, filled: false },
} as const;

export type LucideIconSymbolName = keyof typeof MAPPING;

export function LucideIconSymbol({
  name,
  size = 24,
  color,
  style,
  strokeWidth = 2.2,
}: {
  name: LucideIconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
}) {
  const { icon: Icon, filled } = MAPPING[name];

  return (
    <Icon
      color={color}
      fill={filled ? color as any : "none"}
      size={size}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
