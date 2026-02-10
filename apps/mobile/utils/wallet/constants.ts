export const WALLET_CONSTANTS = {
  DEFAULT_LIMIT: 5,
  STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "FROZEN",
  },
  COLORS: {
    PRIMARY: "#0066FF",
    SECONDARY: "#00B4D8",
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    DANGER: "#EF4444",
    PURPLE: "#8B5CF6",
  },
  GRADIENT_COLORS: {
    BALANCE: ["#0066FF", "#00B4D8"] as const,
    TOP_UP: ["#10B981", "#059669"] as const,
    WITHDRAW: ["#F59E0B", "#D97706"] as const,
    REFUND: ["#8B5CF6", "#7C3AED"] as const,
  },
};

export const TAB_TYPES = {
  TRANSACTIONS: "transactions",
  WITHDRAWALS: "withdrawals",
  REFUNDS: "refunds",
} as const;

export type TabType = typeof TAB_TYPES[keyof typeof TAB_TYPES];
