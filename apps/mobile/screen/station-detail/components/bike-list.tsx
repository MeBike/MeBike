import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Bike } from "../../../types/BikeTypes";

import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  bikeListSection: {
    backgroundColor: BikeColors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: BikeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginBottom: 16,
  },
  bikeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: BikeColors.background,
  },
  bikeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bikeStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bikeId: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.onSurface,
  },
  bikeType: {
    fontSize: 12,
    color: BikeColors.success,
    marginTop: 2,
  },
  bikeItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  bikeStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  bikeRating: {
    fontSize: 12,
    color: BikeColors.onSurfaceVariant,
    marginTop: 2,
  },
  loadMoreButton: {
    backgroundColor: BikeColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
  },
  loadMoreButtonText: {
    color: BikeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BikeColors.background,
  },
  errorText: {
    fontSize: 18,
    color: BikeColors.error,
  },
});

type BikeListProps = {
  bikes: Bike[];
  onBikePress: (bike: Bike) => void;
  onLoadMore: () => void;
  isFetching: boolean;
  hasMore: boolean;
  totalRecords: number;
};

function BikeListItem({
  bike,
  onPress,
}: {
  bike: Bike;
  onPress: (bike: Bike) => void;
}) {
  const isAvailable = bike.status === "CÓ SẴN";

  return (
    <TouchableOpacity
      key={bike._id}
      style={styles.bikeItem}
      onPress={() => onPress(bike)}
      activeOpacity={0.85}
    >
      <View style={styles.bikeItemLeft}>
        <View
          style={[
            styles.bikeStatusIndicator,
            {
              backgroundColor: isAvailable
                ? BikeColors.success
                : BikeColors.error,
            },
          ]}
        />
        <View>
          <Text style={styles.bikeId}>
            ChipID: #
            {bike.chip_id || bike._id.slice(-4)}
          </Text>
          <Text style={styles.bikeType}>Xe thường</Text>
          {bike.total_ratings !== undefined
            ? (
                bike.total_ratings > 0
                  ? (
                      <Text style={styles.bikeRating}>
                        ⭐
                        {" "}
                        {bike.average_rating?.toFixed(1)}
                        {" "}
                        (
                        {bike.total_ratings}
                        )
                      </Text>
                    )
                  : (
                      <Text style={styles.bikeRating}>
                        Chưa có đánh giá
                      </Text>
                    )
              )
            : null}
        </View>
      </View>

      <View style={styles.bikeItemRight}>
        <Text
          style={[
            styles.bikeStatus,
            {
              color: isAvailable
                ? BikeColors.success
                : BikeColors.error,
            },
          ]}
        >
          {isAvailable ? "Có sẵn" : "Đang thuê"}
        </Text>

        <Ionicons name="chevron-forward" size={16} color={BikeColors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
}

export function BikeList({
  bikes,
  onBikePress,
  onLoadMore,
  isFetching,
  hasMore,
  totalRecords,
}: BikeListProps) {
  if (bikes && bikes.length > 0) {
    return (
      <View style={styles.bikeListSection}>
        <Text style={styles.sectionTitle}>
          Danh sách xe (
          {bikes.length}
          )
        </Text>
        {bikes.map(bike => (
          <BikeListItem
            key={bike._id}
            bike={bike}
            onPress={onBikePress}
          />
        ))}
        {hasMore && bikes.length <= totalRecords && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={onLoadMore}
            disabled={isFetching}
          >
            {isFetching
              ? (
                  <ActivityIndicator size="small" color="#fff" />
                )
              : (
                  <Text style={styles.loadMoreButtonText}>Tải thêm xe</Text>
                )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Xe đang được thuê hết</Text>
    </View>
  );
}
