import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RentalDetail } from "../../../types/RentalTypes";
import { RatingDetail as Rating, RatingReason } from "../../../types/RatingTypes";

type Props = {
  booking: RentalDetail;
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

const RatingSection = ({
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
}: Props) => {
  if (booking.status !== "HOÀN THÀNH") {
    return null;
  }

  return (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingSectionTitle}>Đánh giá chuyến đi</Text>
      {hasRated && existingRating ? (
        <View style={styles.existingRatingContainer}>
          <View style={styles.ratingStarsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Ionicons
                key={value}
                name={value <= existingRating.rating ? "star" : "star-outline"}
                size={24}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.ratingValueText}>
            {existingRating.rating} sao
          </Text>

          {existingRating.reason_details &&
            existingRating.reason_details.length > 0 && (
              <>
                <Text style={styles.reasonsTitle}>Lý do đánh giá:</Text>
                <View style={styles.selectedReasonsContainer}>
                  {existingRating.reason_details.map((reason: RatingReason) => (
                    <View key={reason._id} style={styles.selectedReasonChip}>
                      <View style={styles.reasonHeader}>
                        <Text style={styles.reasonTypeText}>
                          {getAppliesTo(reason.applies_to)}
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

          <Text style={[styles.ratingPrompt, { marginTop: 12 }]}>Lý do</Text>
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
              {isSubmittingRating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.ratingSubmitText}>Gửi đánh giá</Text>
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
            Bạn có tối đa 7 ngày kể từ khi kết thúc chuyến đi để gửi đánh giá.
          </Text>
        </>
      ) : (
        <Text style={styles.ratingSectionDescription}>
          Chuyến đi vẫn đang diễn ra hoặc chưa đủ điều kiện để đánh giá.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
      existingRatingContainer: {
        marginTop: 12,
        gap: 8,
      },
      ratingValueText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0066FF",
        marginTop: 4,
      },
      reasonsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginTop: 12,
        marginBottom: 4,
      },
      ratingTypeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
      },
      selectedReasonsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
      },
      selectedReasonChip: {
        backgroundColor: "#F0F7FF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#0066FF",
        marginBottom: 4,
      },
      reasonHeader: {
        marginBottom: 4,
      },
      reasonTypeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#0066FF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      },
      reasonMessageText: {
        fontSize: 13,
        color: "#333",
        fontWeight: "500",
      },
      selectedReasonText: {
        fontSize: 12,
        color: "#0066FF",
        fontWeight: "500",
      },
      existingCommentContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
      },
      existingCommentLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
      },
      existingCommentText: {
        fontSize: 14,
        color: "#555",
        lineHeight: 20,
      },
});

export default RatingSection;
