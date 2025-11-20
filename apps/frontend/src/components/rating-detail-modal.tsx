import { useEffect, useState } from "react";
import { X, Star, User, Mail, Phone, Calendar, MapPin, Bike } from "lucide-react";
import { ratingService } from "@/services/rating.service";
import { formatDateVN } from "@/utils/dateFormat";
import type { Rating } from "@/types";

interface RatingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratingId: string;
}

export function RatingDetailModal({ isOpen, onClose, ratingId }: RatingDetailModalProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRatingDetail = async () => {
    try {
      setLoading(true);
      const response = await ratingService.getRatingDetail(ratingId);
      setRating(response.data.result);
    } catch (error) {
      console.error("Error fetching rating detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ratingId) {
      fetchRatingDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ratingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết đánh giá</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : rating ? (
            <div className="space-y-6">
              {/* Rating Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 ${
                          star <= rating.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-3xl font-bold text-gray-900">
                    {rating.rating}/5
                  </span>
                </div>
                {rating.comment && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Bình luận:</p>
                    <p className="text-gray-600 italic">&ldquo;{rating.comment}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* User Information */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông tin người dùng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Họ và tên</p>
                      <p className="font-medium text-gray-900">
                        {rating.user?.fullname || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {rating.user?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium text-gray-900">
                        {rating.user?.phone_number || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày đánh giá</p>
                      <p className="font-medium text-gray-900">
                        {formatDateVN(rating.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Information */}
              {rating.rental && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-blue-600" />
                    Thông tin phiên thuê
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Bike className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Xe đạp</p>
                        {rating.rental.bike ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {rating.rental.bike.name}
                            </p>
                            {rating.rental.bike.model && (
                              <p className="text-sm text-gray-500">
                                Model: {rating.rental.bike.model}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="font-medium text-gray-500">Không có</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trạm bắt đầu</p>
                        {rating.rental.start_station ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {rating.rental.start_station.name}
                            </p>
                            {rating.rental.start_station.address && (
                              <p className="text-xs text-gray-500">
                                {rating.rental.start_station.address}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="font-medium text-gray-500">Không có</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trạm kết thúc</p>
                        {rating.rental.end_station ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {rating.rental.end_station.name}
                            </p>
                            {rating.rental.end_station.address && (
                              <p className="text-xs text-gray-500">
                                {rating.rental.end_station.address}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="font-medium text-gray-500">Không có</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                        <p className="font-medium text-gray-900">
                          {rating.rental.start_time ? formatDateVN(rating.rental.start_time) : "Không có"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Thời gian kết thúc</p>
                        <p className="font-medium text-gray-900">
                          {rating.rental.end_time ? formatDateVN(rating.rental.end_time) : "Không có"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-600 font-bold text-lg">₫</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="font-medium text-gray-900">
                          {(() => {
                            // Handle Decimal128 format VND
                            const totalPrice = rating.rental.total_price;
                            if (totalPrice === undefined || totalPrice === null) {
                              return "Không có";
                            }

                            let price = 0;

                            if (typeof totalPrice === 'number') {
                              price = totalPrice;
                            } else if (typeof totalPrice === 'object' && totalPrice && '$numberDecimal' in totalPrice) {
                              price = parseFloat((totalPrice as { $numberDecimal: string }).$numberDecimal);
                            } else if (typeof totalPrice === 'string') {
                              price = parseFloat(totalPrice);
                            }

                            return price.toLocaleString("vi-VN") + " ₫";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Reasons */}
              {rating.reason_details && rating.reason_details.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lý do đánh giá
                  </h3>
                  <div className="space-y-3">
                    {rating.reason_details.map((reason) => (
                      <div
                        key={reason._id}
                        className={`p-4 rounded-lg border-l-4 ${
                          reason.type === "positive"
                            ? "bg-green-50 border-green-500"
                            : "bg-red-50 border-red-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              reason.type === "positive"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {reason.type === "positive" ? "Tích cực" : "Tiêu cực"}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({reason.applies_to})
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {reason.messages.vi}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy thông tin đánh giá
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
