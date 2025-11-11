import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRatingActions } from "@hooks/useRatingActions";
import { useRentalsActions } from "@hooks/useRentalAction";
import { formatVietnamDateTime } from "@utils/date";
import { useStationActions } from "@hooks/useStationAction";
import { useWalletActions } from "@hooks/useWalletAction";

import type { RentalDetail } from "../types/RentalTypes";
import type { StationType } from "../types/StationType";

type RouteParams = {
  bookingId: string;
};

function BookingHistoryDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { myWallet, isLoadingGetMyWallet, getMyWallet } = useWalletActions(true);
  const { stations: data, isLoadingGetAllStations, refetch } = useStationActions(true);
  const [stations, setStations] = useState<StationType[]>(data || []);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [showEndRentalConfirm, setShowEndRentalConfirm] = useState<boolean>(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const {
    useGetDetailRental,
    rentalDetailData,
    isGetDetailRentalFetching,
    isGetDetailRentalError,
    endCurrentRental,
    isEndCurrentRentalLoading,
  } = useRentalsActions(true, bookingId);
  const handleEndRental = (rentalId: string) => {
    endCurrentRental({ id: rentalId });
  };
  useEffect(() => {
    useGetDetailRental();
    getMyWallet();
  }, [bookingId]);
  useEffect(() => {
    refetch();
    setStations(data);
  }, [data]);

  useEffect(() => {
    if (rentalDetailData?.data?.result) {
      console.log("Rental Detail:", JSON.stringify(rentalDetailData.data.result, null, 2));
    }
  }, [rentalDetailData]);
  const rentalResult = rentalDetailData?.data?.result as RentalDetail | undefined;
  const endTimeDate = useMemo(() => {
    if (!rentalResult?.end_time)
      return null;
    const parsed = new Date(rentalResult.end_time);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [rentalResult?.end_time]);
  const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const isWithinRatingWindow = useMemo(() => {
    if (!endTimeDate)
      return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime) || nowTime < endTime)
      return false;
    return nowTime - endTime <= RATING_WINDOW_MS;
  }, [endTimeDate]);
  const ratingWindowExpired = useMemo(() => {
    if (!endTimeDate)
      return false;
    const nowTime = Date.now();
    const endTime = endTimeDate.getTime();
    if (Number.isNaN(endTime))
      return false;
    return nowTime > endTime + RATING_WINDOW_MS;
  }, [endTimeDate]);
  const canOpenRatingForm = Boolean(rentalResult)
    && rentalResult!.status === "HOÀN THÀNH"
    && !hasRated
    && !ratingWindowExpired;

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled: showRatingForm && Boolean(rentalResult),
  });

  const filteredReasons = useMemo(() => {
    if (!ratingReasons || ratingReasons.length === 0)
      return [];
    if (!ratingValue)
      return ratingReasons;
    const positive = ratingValue >= 4;
    const desiredType = positive ? "Khen ngợi" : "Vấn đề";
    const matching = ratingReasons.filter(reason => reason.type === desiredType);
    return matching.length > 0 ? matching : ratingReasons;
  }, [ratingReasons, ratingValue]);

  useEffect(() => {
    setShowAllReasons(false);
  }, [ratingValue]);

  const displayReasons = useMemo(() => {
    if (showAllReasons)
      return filteredReasons;
    return filteredReasons.slice(0, 6);
  }, [filteredReasons, showAllReasons]);

  const resetRatingState = useCallback(() => {
    setRatingValue(0);
    setSelectedReasons([]);
    setRatingComment("");
    setRatingError(null);
  }, []);

  useEffect(() => {
    setShowRatingForm(false);
    setHasRated(false);
    resetRatingState();
  }, [bookingId, resetRatingState]);

  const handleToggleReason = useCallback((reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId],
    );
  }, []);

  const handleOpenRatingForm = useCallback(() => {
    if (!canOpenRatingForm)
      return;
    setRatingError(null);
    setShowRatingForm(true);
    refetchRatingReasons();
  }, [canOpenRatingForm, refetchRatingReasons]);

  const handleCancelRating = useCallback(() => {
    resetRatingState();
    setShowRatingForm(false);
  }, [resetRatingState]);

  const handleSubmitRating = useCallback(() => {
    if (!rentalResult?._id) {
      setRatingError("Không tìm thấy mã thuê xe để đánh giá.");
      return;
    }
    if (!ratingValue) {
      setRatingError("Vui lòng chọn số sao.");
      return;
    }
    submitRating(
      rentalResult._id,
      {
        rating: ratingValue,
        reason_ids: selectedReasons,
        comment: ratingComment.trim() ? ratingComment.trim() : undefined,
      },
      {
        onSuccess: () => {
          setHasRated(true);
          setShowRatingForm(false);
          resetRatingState();
        },
        onAlreadyRated: () => {
          setHasRated(true);
          setShowRatingForm(false);
          resetRatingState();
        },
        onError: (message) => {
          setRatingError(message);
        },
      },
    );
  }, [
    submitRating,
    rentalResult?._id,
    ratingValue,
    selectedReasons,
    ratingComment,
    resetRatingState,
  ]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "HOÀN THÀNH":
        return "#4CAF50";
      case "ĐANG THUÊ":
        return "#FF9800";
      case "ĐÃ HỦY":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "HOÀN THÀNH":
        return "Hoàn thành";
      case "ĐANG THUÊ":
        return "Đang thuê";
      case "ĐÃ HỦY":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "HOÀN THÀNH":
        return "checkmark-circle";
      case "ĐANG THUÊ":
        return "time";
      case "ĐÃ HỦY":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

const formatDate = (dateString: string) =>
  formatVietnamDateTime(dateString, { includeSeconds: true });

  const formatDuration = (duration: number, hasEnded: boolean) => {
    if (!duration || duration <= 0) {
      return hasEnded ? "0 phút" : "Chưa kết thúc";
    }
    const totalMinutes = Math.floor(duration);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    if (hours > 0) {
      return `${hours} giờ`;
    }
    return `${minutes} phút`;
  };

  if (isGetDetailRentalFetching && isLoadingGetAllStations) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      </View>
    );
  }
  const isInitialLoading = isGetDetailRentalFetching || isLoadingGetAllStations;
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (isGetDetailRentalError || !rentalResult) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Không thể tải chi tiết</Text>
          <Text style={styles.errorSubtext}>Vui lòng thử lại sau</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={useGetDetailRental}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const booking = rentalResult as RentalDetail;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(booking.status)}
              size={32}
              color={getStatusColor(booking.status)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Trạng thái</Text>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(booking.status) },
                ]}
              >
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bike Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Thông tin xe</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã xe:</Text>
            <Text style={styles.infoValue}>
              {typeof booking.bike === "object"
                ? booking.bike._id
                : booking.bike || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạm bắt đầu:</Text>
            <Text style={styles.infoValue}>
              {typeof booking.start_station === "object"
                ? booking.start_station.name
                : booking.start_station || "Không có dữ liệu"}
            </Text>
          </View>
          {booking.end_station === null ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạm kết thúc:</Text>
              <Text style={styles.infoValue}>Xe chưa được trả</Text>
            </View>
          ) : typeof booking.end_station === "object" &&
            booking.end_station.name ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trạm kết thúc:</Text>
                <Text style={styles.infoValue}>{booking.end_station.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ kết thúc:</Text>
                <Text style={styles.infoValue}>
                  {booking.end_station.address}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạm kết thúc:</Text>
              <Text style={styles.infoValue}>
                {typeof booking.end_station === "string"
                  ? booking.end_station
                  : "Không có dữ liệu"}
              </Text>
            </View>
          )}
        </View>

        {/* Time Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Thời gian</Text>
          </View>
          <View style={styles.timeSection}>
            <View style={styles.timeRow}>
              <View style={styles.timeIcon}>
                <Ionicons name="play-circle" size={20} color="#4CAF50" />
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Bắt đầu</Text>
                <Text style={styles.timeDate}>
                  {formatDate(booking.start_time)}
                </Text>
                <Text style={styles.timeValue}>{formatDate(booking.start_time)}</Text>
              </View>
            </View>

            {booking.end_time && (
              <View style={styles.timeRow}>
                <View style={styles.timeIcon}>
                  <Ionicons name="stop-circle" size={20} color="#F44336" />
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Kết thúc</Text>
                  <Text style={styles.timeDate}>{formatDate(booking.end_time)}</Text>
                  <Text style={styles.timeValue}>{formatDate(booking.end_time)}</Text>
                </View>
              </View>
            )}

            {/* <View style={styles.durationContainer}>
              <Ionicons name="hourglass" size={16} color="#666" />
              <Text style={styles.durationText}>
                Thời gian thuê: {(booking.duration, Boolean(booking.end_time))}
              </Text>
            </View> */}
          </View>
        </View>

        {/* Payment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Thanh toán</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng tiền:</Text>
            <Text style={styles.paymentAmount}>
              {typeof booking.total_price === "object" &&
              booking.total_price !== null
                ? Number.parseFloat(
                    booking.total_price.$numberDecimal
                  ).toLocaleString("vi-VN")
                : Number(booking.total_price).toLocaleString("vi-VN")}{" "}
              đ
            </Text>
          </View>
        </View>

        {/* Booking ID Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Mã đặt xe</Text>
          </View>
          <Text style={styles.bookingId}>{booking._id}</Text>
          <Text style={styles.bookingIdNote}>
            Lưu mã này để tra cứu hoặc liên hệ hỗ trợ
          </Text>
        </View>

        {/* User Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Thông tin người dùng</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ tên:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.fullname || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.username || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.email || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.phone_number || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.location || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái xác thực:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.verify || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.role || "Không có dữ liệu"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo tài khoản:</Text>
            <Text style={styles.infoValue}>
              {booking.user?.created_at
                ? formatDate(booking.user.created_at)
                : "Không có dữ liệu"}
            </Text>
          </View>
        </View>

        {booking.status === "HOÀN THÀNH" && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingSectionTitle}>Đánh giá chuyến đi</Text>
            {hasRated ? (
              <Text style={styles.ratingSectionDescription}>
                Bạn đã đánh giá chuyến đi này. Cảm ơn bạn đã chia sẻ trải
                nghiệm!
              </Text>
            ) : ratingWindowExpired ? (
              <Text style={styles.ratingSectionDescription}>
                Đã quá thời hạn 7 ngày để đánh giá chuyến đi này.
              </Text>
            ) : showRatingForm && canOpenRatingForm ? (
              <View style={styles.ratingForm}>
                <Text style={styles.ratingPrompt}>Chọn số sao</Text>
                <View style={styles.ratingStarsRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.ratingStarButton}
                      onPress={() => {
                        setRatingValue(value);
                        setRatingError(null);
                      }}
                    >
                      <Ionicons
                        name={value <= ratingValue ? "star" : "star-outline"}
                        size={30}
                        color="#FFD700"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingError ? (
                  <Text style={styles.ratingErrorText}>{ratingError}</Text>
                ) : null}

                <Text style={[styles.ratingPrompt, { marginTop: 12 }]}>
                  Lý do
                </Text>
                {isRatingReasonsLoading ? (
                  <ActivityIndicator size="small" color="#0066FF" />
                ) : filteredReasons.length === 0 ? (
                  <Text style={styles.ratingSectionDescription}>
                    Chưa có lý do gợi ý.
                  </Text>
                ) : (
                  <>
                    {ratingValue === 0 && (
                      <Text style={styles.ratingHintText}>
                        Chọn số sao để xem các gợi ý phù hợp.
                      </Text>
                    )}
                    <View style={styles.ratingReasonChips}>
                      {displayReasons.map((reason) => {
                        const isSelected = selectedReasons.includes(reason._id);
                        return (
                          <TouchableOpacity
                            key={reason._id}
                            style={[
                              styles.ratingReasonChip,
                              isSelected && styles.ratingReasonChipSelected,
                            ]}
                            onPress={() => handleToggleReason(reason._id)}
                          >
                            <Text
                              style={[
                                styles.ratingReasonChipText,
                                isSelected &&
                                  styles.ratingReasonChipTextSelected,
                              ]}
                            >
                              {reason.messages}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {filteredReasons.length > 6 && (
                      <TouchableOpacity
                        style={styles.ratingToggleButton}
                        onPress={() => setShowAllReasons((prev) => !prev)}
                      >
                        <Text style={styles.ratingToggleText}>
                          {showAllReasons ? "Thu gọn" : "Xem thêm"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <Text style={[styles.ratingPrompt, { marginTop: 12 }]}>
                  Nhận xét (không bắt buộc)
                </Text>
                <TextInput
                  style={styles.ratingCommentInput}
                  placeholder="Chia sẻ cảm nghĩ của bạn"
                  multiline
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  maxLength={500}
                />

                <View style={styles.ratingFormActions}>
                  <TouchableOpacity
                    style={[
                      styles.ratingCancelButton,
                      isSubmittingRating && { opacity: 0.6 },
                    ]}
                    onPress={handleCancelRating}
                    disabled={isSubmittingRating}
                  >
                    <Text style={styles.ratingCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.ratingSubmitButton,
                      isSubmittingRating && { opacity: 0.8 },
                    ]}
                    onPress={handleSubmitRating}
                    disabled={isSubmittingRating}
                  >
                    {isSubmittingRating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#fff" />
                        <Text style={styles.ratingSubmitText}>
                          Gửi đánh giá
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : canOpenRatingForm ? (
              <>
                <Text style={styles.ratingSectionDescription}>
                  Hãy chia sẻ trải nghiệm của bạn sau chuyến đi.
                </Text>
                <TouchableOpacity
                  style={styles.ratingActionButton}
                  onPress={handleOpenRatingForm}
                >
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={styles.ratingActionButtonText}>
                    Đánh giá chuyến đi
                  </Text>
                </TouchableOpacity>
                <Text style={styles.ratingWindowHint}>
                  Bạn có tối đa 7 ngày kể từ khi kết thúc chuyến đi để gửi đánh
                  giá.
                </Text>
              </>
            ) : (
              <Text style={styles.ratingSectionDescription}>
                Chuyến đi vẫn đang diễn ra hoặc chưa đủ điều kiện để đánh giá.
              </Text>
            )}
          </View>
        )}

        {booking.status === "ĐANG THUÊ" && (
          <>
            <TouchableOpacity
              style={[
                styles.endRentalButton,
                isEndCurrentRentalLoading && { opacity: 0.6 },
              ]}
              // disabled={isEndCurrentRentalLoading}
              onPress={() => handleEndRental(booking._id)}
            >
              <Ionicons name="stop-circle" size={20} color="#fff" />
              <Text style={styles.endRentalButtonText}>
                Kết thúc phiên thuê
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => {
            (navigation as any).navigate("Report", {
              bike_id: booking.bike?._id || booking.bike,
              station_id: booking.start_station?._id || booking.start_station,
              rental_id: booking._id,
            });
          }}
        >
          <Ionicons name="warning" size={20} color="#0066FF" />
          <Text style={styles.supportButtonText}>Báo cáo sự cố</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  timeSection: {
    marginTop: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  timeDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0066FF",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  durationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0066FF",
  },
  bookingId: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 8,
  },
  bookingIdNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#0066FF",
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066FF",
    marginLeft: 8,
  },
  ratingSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ratingSectionDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  ratingForm: {
    marginTop: 12,
    gap: 12,
  },
  ratingPrompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ratingStarButton: {
    padding: 4,
  },
  ratingErrorText: {
    color: "#F44336",
    fontSize: 12,
  },
  ratingReasonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingHintText: {
    fontSize: 12,
    color: "#777",
  },
  ratingReasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d0d7de",
    backgroundColor: "#fff",
  },
  ratingReasonChipSelected: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  ratingReasonChipText: {
    fontSize: 13,
    color: "#333",
  },
  ratingReasonChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  ratingToggleButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EEF3FF",
  },
  ratingToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#246BFD",
  },
  ratingCommentInput: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#333",
  },
  ratingFormActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  ratingCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0d7de",
    alignItems: "center",
  },
  ratingCancelText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  ratingSubmitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    borderRadius: 10,
  },
  ratingSubmitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingActionButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ratingActionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingWindowHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  endRentalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  endRentalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});

export default BookingHistoryDetail;
