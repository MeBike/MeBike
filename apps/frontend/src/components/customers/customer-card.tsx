"use client";

import type { Customer } from "@custom-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Eye,
  Edit,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CustomerCardProps {
  customer: Customer;
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onBlock?: (customer: Customer) => void;
}

const statusConfig = {
  active: {
    label: "Hoạt động",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  inactive: {
    label: "Không hoạt động",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  blocked: {
    label: "Đã chặn",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const typeConfig = {
  individual: {
    label: "Cá nhân",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  corporate: {
    label: "Doanh nghiệp",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};

export function CustomerCard({
  customer,
  onView,
  onEdit,
  onBlock,
}: CustomerCardProps) {
  const status = statusConfig[customer.status];
  const type = typeConfig[customer.customer_type];
  const initials = customer.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="p-5 space-y-4">
        {/* Header with Avatar */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarImage
              src={customer.avatar || "/placeholder.svg"}
              alt={customer.full_name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground truncate">
                  {customer.full_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {customer.customer_code}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            </div>
            <Badge className={`${type.className} mt-2`}>{type.label}</Badge>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{customer.phone_number}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{customer.city}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Tổng đơn thuê</p>
            <p className="text-lg font-bold text-foreground">
              {customer.total_rentals}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
            <p className="text-lg font-bold text-primary">
              {customer.total_spent.toLocaleString()}đ
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đang thuê</p>
            <p className="text-lg font-bold text-blue-500">
              {customer.current_rentals}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đánh giá</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <p className="text-lg font-bold text-foreground">
                {customer.rating.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Last Rental */}
        {customer.last_rental_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Calendar className="w-3 h-3" />
            <span>
              Thuê gần nhất:{" "}
              {format(new Date(customer.last_rental_date), "dd/MM/yyyy", {
                locale: vi,
              })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onView?.(customer)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Xem
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onEdit?.(customer)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Sửa
          </Button>
          {customer.status !== "blocked" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBlock?.(customer)}
            >
              <Ban className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
