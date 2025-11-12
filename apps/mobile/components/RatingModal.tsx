import { Ionicons } from "@expo/vector-icons";
import { useRatingActions } from "@hooks/useRatingActions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RatingModalProps = {
  visible: boolean;
  onClose: () => void;
  rentalId: string;
  onRated?: () => void;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#0066FF",
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  prompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  ratingStarButton: {
    padding: 4,
  },
  ratingErrorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  hintText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  ratingReasonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
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
    marginTop: 8,
  },
  formActions: {
    marginTop: 24,
    marginBottom: 32,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

function RatingModal({ visible, onClose, rentalId, onRated }: RatingModalProps) {
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showAllReasons, setShowAllReasons] = useState(false);

  const {
    ratingReasons,
    isRatingReasonsLoading,
    submitRating,
    isSubmittingRating,
    refetchRatingReasons,
  } = useRatingActions({
    enabled: visible,
  });

  const filteredReasons = useMemo(() => {
    if (!ratingReasons || ratingReasons.length === 0) {
      return [];
    }
    if (!ratingValue) {
      return ratingReasons;
    }
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
    if (!visible) {
      resetRatingState();
    }
    else {
      refetchRatingReasons();
    }
  }, [visible, resetRatingState, refetchRatingReasons]);

  const handleToggleReason = useCallback((reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId],
    );
  }, []);

  const handleSubmitRating = useCallback(() => {
    if (!ratingValue) {
      setRatingError("Vui lòng chọn số sao.");
      return;
    }
    submitRating(
      rentalId,
      {
        rating: ratingValue,
        reason_ids: selectedReasons,
        comment: ratingComment.trim() ? ratingComment.trim() : undefined,
      },
      {
        onSuccess: () => {
          onRated?.();
          onClose();
          resetRatingState();
        },
        onAlreadyRated: () => {
          onClose();
          resetRatingState();
        },
        onError: (message) => {
          setRatingError(message);
        },
      },
    );
  }, [
    submitRating,
    rentalId,
    ratingValue,
    selectedReasons,
    ratingComment,
    resetRatingState,
    onRated,
    onClose,
  ]);

  const handleSkip = useCallback(() => {
    onClose();
    resetRatingState();
  }, [onClose, resetRatingState]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đánh giá chuyến đi</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.prompt}>Chọn số sao</Text>
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

          <Text style={[styles.prompt, { marginTop: 12 }]}>
            Lý do
          </Text>
          {isRatingReasonsLoading
            ? (
                <ActivityIndicator size="small" color="#0066FF" />
              )
            : filteredReasons.length === 0
              ? (
                  <Text style={styles.sectionDescription}>
                    Chưa có lý do gợi ý.
                  </Text>
                )
              : (
                  <>
                    {ratingValue === 0 && (
                      <Text style={styles.hintText}>
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
                                isSelected
                                && styles.ratingReasonChipTextSelected,
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
                        onPress={() => setShowAllReasons(prev => !prev)}
                      >
                        <Text style={styles.ratingToggleText}>
                          {showAllReasons ? "Thu gọn" : "Xem thêm"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

          <Text style={[styles.prompt, { marginTop: 12 }]}>
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

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[
                styles.submitButton,
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
                      <Text style={styles.submitText}>
                        Gửi đánh giá
                      </Text>
                    </>
                  )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default RatingModal;
