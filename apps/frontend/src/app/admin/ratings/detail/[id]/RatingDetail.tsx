"use client";

import React from "react";
import {
  Star,
  Bike,
  MapPin,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  Hash,
  Phone,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";
import { formatToVNTime } from "@lib/formatVNDate";
import { Rating } from "@/types";

interface DetailRatingProps {
  rating: Rating;
}

export default function DetailRating({ rating }: DetailRatingProps) {
  // Hàm hiển thị màu sắc dựa trên điểm số
  const getScoreStyle = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-5 w-5 ${
              s <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chi tiết đánh giá"
        description={`Mã đơn thuê: ${rating.rentalId}`}
        backLink="/admin/ratings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Người đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarFallback className="bg-blue-800 text-white text-3xl font-bold">
                {rating.user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center space-y-2">
              <h3 className="font-bold text-xl text-foreground">{rating.user.fullName}</h3>
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> ID: {rating.user.id}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="h-3.5 w-3.5" /> {rating.user.phoneNumber}
                </span>
              </div>
            </div>
            
            <div className="w-full pt-6 border-t space-y-4">
              <div className="flex justify-between items-start text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Thời gian:
                </span>
                <span className="font-semibold text-right">{formatToVNTime(rating.createdAt)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-sm flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Mã đơn thuê:
                </span>
                <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all border italic">
                  {rating.rentalId}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cột phải: Đánh giá & Phản hồi - 8/12 width */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Đánh giá xe */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Bike className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Đánh giá Xe</p>
                    <p className="text-xs text-muted-foreground">Chip ID: <span className="font-mono font-medium">{rating.bike.chipId}</span></p>
                  </div>
                </div>
                <div className="space-y-3">
                  {renderStars(rating.bikeScore)}
                  <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreStyle(rating.bikeScore)}`}>
                    {rating.bikeScore}/5 Điểm
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Đánh giá trạm */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Đánh giá Trạm</p>
                    <p className="text-xs text-muted-foreground font-medium">{rating.station.name}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {renderStars(rating.stationScore)}
                  <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreStyle(rating.stationScore)}`}>
                    {rating.stationScore}/5 Điểm
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chi tiết phản hồi */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-md">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Chi tiết phản hồi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Lý do cụ thể:</Label>
                <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-dashed">
                  <div className={`p-2 rounded-full ${rating.reasons.type === "ISSUE" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {rating.reasons.type === "ISSUE" ? <AlertCircle className="h-5 w-5" /> : <ThumbsUp className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1">
                    <Badge className={rating.reasons.type === "ISSUE" ? "bg-red-500" : "bg-green-500"}>
                      {rating.reasons.type === "ISSUE" ? "Sự cố / Vấn đề" : "Khen ngợi"}
                    </Badge>
                    <p className="text-sm font-semibold mt-1 italic text-muted-foreground">
                      Phân loại: <span className="text-foreground">{rating.reasons.appliesTo === "bike" ? "Về Xe" : "Về Trạm"}</span>
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">"{rating.reasons.message}"</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Bình luận thêm:</Label>
                <div className="p-4 rounded-xl bg-muted/10 border text-sm text-foreground min-h-[100px] leading-relaxed shadow-sm">
                  {rating.comment ? (
                    rating.comment
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Người dùng không để lại lời nhắn thêm.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}