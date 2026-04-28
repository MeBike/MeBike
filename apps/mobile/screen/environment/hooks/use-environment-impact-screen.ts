import { useEnvironmentImpactHistoryQuery } from "@hooks/query/environment/use-environment-impact-history-query";
import { useEnvironmentSummaryQuery } from "@hooks/query/environment/use-environment-summary-query";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";

import type {
  EnvironmentImpactHistoryItem,
  EnvironmentImpactHistoryQuery,
} from "@/contracts/server";
import type { EnvironmentImpactNavigationProp } from "@/types/navigation";

export type HistoryRangeKey = "all" | "last7Days" | "thisMonth" | "custom";

export type HistoryRangeOption = {
  key: HistoryRangeKey;
  label: string;
  description: string;
};

export type QuickHistoryRangeOption = {
  key: "all" | "last7Days" | "thisMonth";
  label: string;
  description: string;
};

type CustomDateRange = {
  from: Date;
  to: Date;
};

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const HISTORY_RANGE_OPTIONS: readonly HistoryRangeOption[] = [
  {
    key: "all",
    label: "Tất cả thời gian",
    description: "Hiển thị toàn bộ lịch sử đóng góp đã được tính toán.",
  },
  {
    key: "last7Days",
    label: "7 ngày qua",
    description: "Chỉ xem các chuyến đi trong 7 ngày gần đây.",
  },
  {
    key: "thisMonth",
    label: "Tháng này",
    description: "Chỉ xem các chuyến đi trong tháng hiện tại.",
  },
  {
    key: "custom",
    label: "Tùy chọn",
    description: "Chọn khoảng ngày bắt đầu và kết thúc theo ý muốn.",
  },
] as const;

function buildCustomDateRange(now: Date): CustomDateRange {
  return {
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: now,
  };
}

function getVietnamDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find(part => part.type === "year")?.value ?? "0"),
    month: Number(parts.find(part => part.type === "month")?.value ?? "1"),
    day: Number(parts.find(part => part.type === "day")?.value ?? "1"),
  };
}

function shiftCalendarDate(
  parts: { year: number; month: number; day: number },
  days: number,
) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  shifted.setUTCDate(shifted.getUTCDate() + days);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function toVietnamUtcBoundaryFromParts(
  parts: { year: number; month: number; day: number },
  boundary: "start" | "end",
) {
  const utcBase = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    boundary === "start" ? 0 : 23,
    boundary === "start" ? 0 : 59,
    boundary === "start" ? 0 : 59,
    boundary === "start" ? 0 : 999,
  );

  return new Date(utcBase - VIETNAM_UTC_OFFSET_MS).toISOString();
}

function buildHistoryParams(
  range: HistoryRangeKey,
  customRange: CustomDateRange,
): EnvironmentImpactHistoryQuery {
  const params: EnvironmentImpactHistoryQuery = {
    pageSize: 20,
    sortOrder: "desc",
  };

  if (range === "all") {
    return params;
  }

  if (range === "custom") {
    const fromParts = {
      year: customRange.from.getFullYear(),
      month: customRange.from.getMonth() + 1,
      day: customRange.from.getDate(),
    };
    const toParts = {
      year: customRange.to.getFullYear(),
      month: customRange.to.getMonth() + 1,
      day: customRange.to.getDate(),
    };

    return {
      ...params,
      dateFrom: toVietnamUtcBoundaryFromParts(fromParts, "start"),
      dateTo: toVietnamUtcBoundaryFromParts(toParts, "end"),
    };
  }

  if (range === "thisMonth") {
    const vietnamToday = getVietnamDateParts(new Date());
    return {
      ...params,
      dateFrom: toVietnamUtcBoundaryFromParts(
        {
          ...vietnamToday,
          day: 1,
        },
        "start",
      ),
      dateTo: toVietnamUtcBoundaryFromParts(vietnamToday, "end"),
    };
  }

  const vietnamToday = getVietnamDateParts(new Date());
  const dateFrom = shiftCalendarDate(vietnamToday, -6);

  return {
    ...params,
    dateFrom: toVietnamUtcBoundaryFromParts(dateFrom, "start"),
    dateTo: toVietnamUtcBoundaryFromParts(vietnamToday, "end"),
  };
}

function flattenHistory(pages: Array<{ data: EnvironmentImpactHistoryItem[] }> | undefined) {
  if (!pages) {
    return [];
  }

  const seenIds = new Set<string>();
  const items: EnvironmentImpactHistoryItem[] = [];

  for (const page of pages) {
    for (const item of page.data) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }
  }

  return items;
}

export function useEnvironmentImpactScreen() {
  const navigation = useNavigation<EnvironmentImpactNavigationProp>();
  const { isAuthenticated, user } = useAuthNext();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<HistoryRangeKey>("all");
  const [draftRange, setDraftRange] = useState<HistoryRangeKey>("all");
  const [customRange, setCustomRange] = useState<CustomDateRange>(() => buildCustomDateRange(new Date()));
  const [draftCustomRange, setDraftCustomRange] = useState<CustomDateRange>(() => buildCustomDateRange(new Date()));
  const [activeDateField, setActiveDateField] = useState<"from" | "to">("from");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const historyParams = useMemo(
    () => buildHistoryParams(selectedRange, customRange),
    [customRange, selectedRange],
  );
  const summaryQuery = useEnvironmentSummaryQuery(isAuthenticated, user?.id);
  const historyQuery = useEnvironmentImpactHistoryQuery(historyParams, isAuthenticated, user?.id);
  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
    isRefetching: isSummaryRefetching,
    refetch: refetchSummary,
  } = summaryQuery;
  const {
    data: historyData,
    error: historyError,
    isLoading: isHistoryLoading,
    isRefetching: isHistoryRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchHistory,
  } = historyQuery;
  const historyItems = flattenHistory(historyData?.pages);
  const activeRange = HISTORY_RANGE_OPTIONS.find(option => option.key === selectedRange) ?? HISTORY_RANGE_OPTIONS[0];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchSummary(),
        refetchHistory(),
      ]);
    }
    finally {
      setIsRefreshing(false);
    }
  }, [refetchHistory, refetchSummary]);

  const handleOpenDetail = useCallback((rentalId: string) => {
    navigation.navigate("EnvironmentImpactDetail", { rentalId });
  }, [navigation]);

  const handleLoadMoreHistory = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const lastPage = historyData?.pages[historyData.pages.length - 1];
    const nextPage = lastPage ? lastPage.pagination.page + 1 : 1;

    void fetchNextPage({ pageParam: nextPage });
  }, [fetchNextPage, hasNextPage, historyData, isFetchingNextPage]);

  const handleSelectRange = useCallback((range: HistoryRangeKey) => {
    setDraftRange(range);
  }, []);

  const handleCustomDateChange = useCallback((field: "from" | "to", date: Date) => {
    setDraftCustomRange((current) => {
      const next = {
        ...current,
        [field]: date,
      };

      if (next.from > next.to) {
        if (field === "from") {
          return {
            from: date,
            to: date,
          };
        }

        return {
          from: date,
          to: date,
        };
      }

      return next;
    });
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    setCustomRange(draftCustomRange);
    setSelectedRange(draftRange);
    setIsFilterOpen(false);
  }, [draftCustomRange, draftRange]);

  const handleResetFilters = useCallback(() => {
    const resetRange = buildCustomDateRange(new Date());
    setCustomRange(resetRange);
    setDraftCustomRange(resetRange);
    setSelectedRange("all");
    setDraftRange("all");
    setActiveDateField("from");
    setIsFilterOpen(false);
  }, []);

  const customRangeLabel = useMemo(() => {
    if (selectedRange !== "custom") {
      return null;
    }

    return `${new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }).format(customRange.from)
    } - ${
      new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }).format(customRange.to)}`;
  }, [customRange, selectedRange]);

  return {
    summary: summary ?? null,
    summaryError,
    historyItems,
    activeRange,
    isInitialLoading: (!summary && isSummaryLoading)
      || (historyItems.length === 0 && !historyData && isHistoryLoading),
    initialError: summaryError ?? historyError,
    isRefreshing: isRefreshing || isSummaryRefetching || isHistoryRefetching,
    hasHistoryRefreshError: Boolean(historyError) && historyItems.length > 0,
    historyRefreshError: historyError,
    history: {
      hasNextPage,
      isFetchingNextPage,
      loadMore: handleLoadMoreHistory,
    },
    filter: {
      isOpen: isFilterOpen,
      options: HISTORY_RANGE_OPTIONS.filter(option => option.key !== "custom") as QuickHistoryRangeOption[],
      customRangeLabel,
      activeDateField,
      draftRange,
      customRange,
      draftCustomRange,
      open: () => {
        setDraftRange(selectedRange);
        setDraftCustomRange(customRange);
        setActiveDateField("from");
        setIsFilterOpen(true);
      },
      close: () => setIsFilterOpen(false),
      select: handleSelectRange,
      selectDateField: setActiveDateField,
      changeCustomDate: handleCustomDateChange,
      applyCustomRange: handleApplyCustomRange,
      reset: handleResetFilters,
    },
    actions: {
      goBack: () => navigation.goBack(),
      onRefresh: handleRefresh,
      openDetail: handleOpenDetail,
    },
  };
}
