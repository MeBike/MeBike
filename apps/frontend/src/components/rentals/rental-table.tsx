"use client";

import type { Rental } from "@custom-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface RentalTableProps {
  rentals: Rental[];
  onView?: (rental: Rental) => void;
  onEdit?: (rental: Rental) => void;
  onComplete?: (rental: Rental) => void;
  onCancel?: (rental: Rental) => void;
}

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  active: {
    label: "Đang thuê",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  overdue: {
    label: "Quá hạn",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

const paymentStatusConfig = {
  pending: {
    label: "Chưa thanh toán",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  refunded: {
    label: "Đã hoàn tiền",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

export function RentalTable({
  rentals,
  onView,
  onEdit,
  onComplete,
  onCancel,
}: RentalTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Xe đạp</TableHead>
            <TableHead>Thời gian thuê</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => {
            const status = statusConfig[rental.status];
            const paymentStatus = paymentStatusConfig[rental.payment_status];

            return (
              <TableRow key={rental._id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-primary">
                  {rental.rental_code}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {rental.customer_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rental.customer_phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {rental.bike_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rental.bike_type}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-foreground">
                      {format(new Date(rental.start_date), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(rental.end_date), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-foreground">
                    {rental.total_amount.toLocaleString()}đ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cọc: {rental.deposit_amount.toLocaleString()}đ
                  </p>
                </TableCell>
                <TableCell>
                  <Badge className={paymentStatus.className}>
                    {paymentStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(rental)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {rental.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(rental)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {rental.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete?.(rental)}
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {(rental.status === "pending" ||
                      rental.status === "active") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel?.(rental)}
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
