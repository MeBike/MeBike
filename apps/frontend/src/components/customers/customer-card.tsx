"use client";

import type { Customer } from "@custom-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit, Ban, Mail, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CustomerCardProps {
  customer: Customer;
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onBlock?: (customer: Customer) => void;
}

// const statusConfig = {
//   active: {
//     label: "Hoạt động",
//     className: "bg-green-500/10 text-green-500 border-green-500/20",
//   },
//   inactive: {
//     label: "Không hoạt động",
//     className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
//   },
//   blocked: {
//     label: "Đã chặn",
//     className: "bg-red-500/10 text-red-500 border-red-500/20",
//   },
// };

// const typeConfig = {
//   individual: {
//     label: "Cá nhân",
//     className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
//   },
//   corporate: {
//     label: "Doanh nghiệp",
//     className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
//   },
// };

export function CustomerCard({
  customer,
  onView,
  onEdit,
  onBlock,
}: CustomerCardProps) {
  const initials = customer.fullname
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
              alt={customer.fullname}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground truncate">
                  {customer.fullname}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{customer.username}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {customer.role === "ADMIN"
                    ? "Quản trị viên"
                    : customer.role === "STAFF"
                      ? "Nhân viên"
                      : "Người dùng"}
                </Badge>
              </div>
            </div>
            <Badge
              className={`${customer.verify === "VERIFIED" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"} mt-2`}
            >
              {customer.verify === "VERIFIED" ? "Đã xác thực" : "Chưa xác thực"}
            </Badge>
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
            <span className="truncate">{customer.location}</span>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">NFC Card UID</p>
            <p className="text-sm font-mono text-foreground">
              {customer.nfc_card_uid || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày tạo</p>
            <p className="text-sm font-bold text-foreground">
              {format(new Date(customer.created_at), "dd/MM/yyyy", {
                locale: vi,
              })}
            </p>
          </div>
        </div>

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
          {/* {customer.verify !== "BANNED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBlock?.(customer)}
            >
              <Ban className="w-4 h-4 text-destructive" />
            </Button>
          )} */}
        </div>
      </div>
    </Card>
  );
}
