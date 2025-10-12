import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { User as DetailUser} from "@custom-types";
import { Mail, MapPin, Phone, User, Calendar } from "lucide-react";

interface ProfileHeaderProps {
  user: DetailUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "staff":
        return "secondary";
      default:
        return "outline";
    }
  };

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
            src={user.avatar || "/placeholder.svg"}
            alt={user.fullname}
          />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {getInitials(user.fullname)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {user.fullname}
            </h2>
            <Badge variant={getRoleBadgeVariant(user.role)} className="w-fit">
              {user.role.toUpperCase()}
            </Badge>
            {user.verify === "verified" && (
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
              <span className="font-mono">{user.username}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{user.phone_number}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Tham gia: {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
