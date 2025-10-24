import React from "react";
import type { RefundStatus } from "@custom-types";
import { CheckCircle, XCircle, Clock } from "lucide-react";
export const getStatusColor = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐÃ DUYỆT":
      return "bg-blue-100 text-blue-800";
    case "TỪ CHỐI":
      return "bg-red-100 text-red-800";
    case "ĐÃ HOÀN THÀNH":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusIcon = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return React.createElement(Clock, { className: "w-4 h-4" });
    case "ĐÃ DUYỆT":
      return React.createElement(CheckCircle, { className: "w-4 h-4" });
    case "ĐÃ HOÀN THÀNH":
      return React.createElement(CheckCircle, { className: "w-4 h-4" });
    case "TỪ CHỐI":
      return React.createElement(XCircle, { className: "w-4 h-4" });
    default:
      return null;
  }
};

export const getStatusLabel = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return "Chờ xử lý";
    case "ĐÃ DUYỆT":
      return "Đã duyệt";
    case "ĐÃ HOÀN THÀNH":
      return "Hoàn thành";
    case "TỪ CHỐI":
      return "Từ chối";
    default:
      return status;
  }
};