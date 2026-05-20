import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DetailUser } from "@/types";
import { Mail, MapPin, Phone, User, Calendar } from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { NotificationBell } from "../notifications/notification-bell";
import { getRoleColor, ROLE_LABELS } from "@/columns/user-columns";
interface ProfileHeaderProps {
  user: DetailUser;
  avatarPreview?: string;
}

export function ProfileHeader({ user, avatarPreview }: ProfileHeaderProps) {

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage
            src={avatarPreview || user.avatar || "/placeholder.svg"}
            alt={user.fullName}
          />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {user.fullName}
            </h2>
            <span
              className={`inline-flex px-1 py-1 rounded-full text-xxs font-medium whitespace-nowrap ${getRoleColor(user.role)}`}>
              {ROLE_LABELS[user.role]}
            </span>
            {user.verify === "VERIFIED" && (
              <Badge
                variant="outline"
                className="w-fit border-accent text-accent"
              >
                ✓ Đã xác thực
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="font-mono">{user.username || "Chưa cập nhật"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user.email || "Chưa cập nhật"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{user.phoneNumber || "Chưa cập nhật"} </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{user.location || "Chưa cập nhật"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Tham gia: {formatToVNTime(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
