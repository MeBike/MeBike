import type { RatingDetail as Rating, RatingReason } from "@services/ratings";

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { Rental } from "@/types/rental-types";

import { styles } from "./rating-section.styles";

type Props = {
  booking: Rental;
  hasRated: boolean;
  existingRating?: Rating;
  canOpenRatingForm: boolean;
  ratingWindowExpired: boolean;
  showRatingForm: boolean;
  ratingValue: number;
  selectedReasons: string[];
  ratingComment: string;
  ratingError: string | null;
  showAllReasons: boolean;
  ratingReasons: RatingReason[];
  isRatingReasonsLoading: boolean;
  isSubmittingRating: boolean;
  displayReasons: RatingReason[];
  filteredReasons: RatingReason[];
  setRatingValue: (value: number) => void;
  setRatingError: (error: string | null) => void;
  setShowAllReasons: (value: boolean) => void;
  handleToggleReason: (reasonId: string) => void;
  setRatingComment: (comment: string) => void;
  handleCancelRating: () => void;
  handleSubmitRating: () => void;
  handleOpenRatingForm: () => void;
  getAppliesTo: (appliesTo: string) => string;
};

function RatingSection({
  booking,
  hasRated,
  existingRating,
  canOpenRatingForm,
  ratingWindowExpired,
  showRatingForm,
  ratingValue,
  selectedReasons,
  ratingComment,
  ratingError,
  showAllReasons,
  ratingReasons,
  isRatingReasonsLoading,
  isSubmittingRating,
  displayReasons,
  filteredReasons,
  setRatingValue,
  setRatingError,
  setShowAllReasons,
  handleToggleReason,
  setRatingComment,
  handleCancelRating,
  handleSubmitRating,
  handleOpenRatingForm,
  getAppliesTo,
}: Props) {
  const existingReasonDetails = React.useMemo(
    () =>
      existingRating
        ? existingRating.reasonIds
            .map(reasonId => ratingReasons.find(reason => reason.id === reasonId))
            .filter((reason): reason is RatingReason => Boolean(reason))
        : [],
    [existingRating, ratingReasons],
  );

  if (booking.status !== "COMPLETED") {
    return null;
  }

  return (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingSectionTitle}>Đánh giá chuyến đi</Text>
      {hasRated && existingRating
        ? (
            <View style={styles.existingRatingContainer}>
              <View style={styles.ratingStarsRow}>
                {[1, 2, 3, 4, 5].map(value => (
                  <Ionicons
                    key={value}
                    name={value <= existingRating.rating ? "star" : "star-outline"}
                    size={24}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={styles.ratingValueText}>
                {existingRating.rating}
                {" "}
                sao
              </Text>

              {existingReasonDetails.length > 0 && (
                <>
                  <Text style={styles.reasonsTitle}>Lý do đánh giá:</Text>
                  <View style={styles.selectedReasonsContainer}>
                    {existingReasonDetails.map(reason => (
                      <View key={reason.id} style={styles.selectedReasonChip}>
                        <View style={styles.reasonHeader}>
                          <Text style={styles.reasonTypeText}>
                            {getAppliesTo(reason.appliesTo)}
                          </Text>
                        </View>
                        <Text style={styles.reasonMessageText}>
                          {reason.messages}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {existingRating.comment && (
                <View style={styles.existingCommentContainer}>
                  <Text style={styles.existingCommentLabel}>Nhận xét:</Text>
                  <Text style={styles.existingCommentText}>
                    {existingRating.comment}
                  </Text>
                </View>
              )}
            </View>
          )
        : ratingWindowExpired
          ? (
              <Text style={styles.ratingSectionDescription}>
                Đã quá thời hạn 7 ngày để đánh giá chuyến đi này.
              </Text>
            )
          : showRatingForm && canOpenRatingForm
            ? (
                <View style={styles.ratingForm}>
                  <Text style={styles.ratingPrompt}>Chọn số sao</Text>
                  <View style={styles.ratingStarsRow}>
                    {[1, 2, 3, 4, 5].map(value => (
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
                  {ratingError
                    ? (
                        <Text style={styles.ratingErrorText}>{ratingError}</Text>
                      )
                    : null}

                  <Text style={[styles.ratingPrompt, { marginTop: 12 }]}>Lý do</Text>
                  {isRatingReasonsLoading
                    ? (
                        <ActivityIndicator size="small" color="#0066FF" />
                      )
                    : filteredReasons.length === 0
                      ? (
                          <Text style={styles.ratingSectionDescription}>
                            Chưa có lý do gợi ý.
                          </Text>
                        )
                      : (
                          <>
                            {ratingValue === 0 && (
                              <Text style={styles.ratingHintText}>
                                Chọn số sao để xem các gợi ý phù hợp.
                              </Text>
                            )}
                            <View style={styles.ratingReasonChips}>
                              {displayReasons.map((reason) => {
                                const isSelected = selectedReasons.includes(reason.id);
                                return (
                                  <TouchableOpacity
                                    key={reason.id}
                                    style={[
                                      styles.ratingReasonChip,
                                      isSelected && styles.ratingReasonChipSelected,
                                    ]}
                                    onPress={() => handleToggleReason(reason.id)}
                                  >
                                    <Text
                                      style={[
                                        styles.ratingReasonChipText,
                                        isSelected && styles.ratingReasonChipTextSelected,
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
                                onPress={() => setShowAllReasons(!showAllReasons)}
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
                      {isSubmittingRating
                        ? (
                            <ActivityIndicator size="small" color="#fff" />
                          )
                        : (
                            <>
                              <Ionicons name="send" size={16} color="#fff" />
                              <Text style={styles.ratingSubmitText}>Gửi đánh giá</Text>
                            </>
                          )}
                    </TouchableOpacity>
                  </View>
                </View>
              )
            : canOpenRatingForm
              ? (
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
                      Bạn có tối đa 7 ngày kể từ khi kết thúc chuyến đi để gửi đánh giá.
                    </Text>
                  </>
                )
              : (
                  <Text style={styles.ratingSectionDescription}>
                    Chuyến đi vẫn đang diễn ra hoặc chưa đủ điều kiện để đánh giá.
                  </Text>
                )}
    </View>
  );
}

export default RatingSection;
