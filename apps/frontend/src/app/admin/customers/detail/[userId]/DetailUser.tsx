
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CreditCard,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Me } from "@/types/GraphQL";
import { formatToVNTime } from "@/lib/formateVNDate";
const statusConfig = {
  Active: { label: "Active", variant: "success" as const },
  Inactive: { label: "Inactive", variant: "muted" as const },
  Banned: { label: "Banned", variant: "destructive" as const },
  Pending: { label: "Pending", variant: "warning" as const },
};

const roleConfig = {
  ADMIN: { label: "Admin", variant: "default" as const },
  STAFF: { label: "Staff", variant: "info" as const },
  USER: { label: "User", variant: "secondary" as const },
  SOS: { label: "Guest", variant: "secondary" as const },
};

interface UserDetailProps {
    user : Me;
}
export default function DetailUser({user}: UserDetailProps) {
   const status = statusConfig[user.status] || statusConfig.Inactive;
   const role = roleConfig[user.role] || roleConfig.USER;
  if (!user) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </div>
    );
  }

//   const status = statusConfig[user.status] || statusConfig.Inactive;
//   const role = roleConfig[user.role] || roleConfig.USER;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <PageHeader title="User Details" backLink="/admin/customers" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              {user.userAccount.email && (
                <p className="text-sm text-muted-foreground">
                  {user.userAccount.email}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <Badge variant={role.variant}>
                  <Shield className="h-3 w-3 mr-1" />
                  {role.label}
                </Badge>
                <Badge >{status.label}</Badge>
              </div>

              {user.verify === "verified" && (
                <div className="flex items-center gap-1 text-sm text-green-600 mt-3">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified Account</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground break-all">
                  {user.userAccount.email}
                </span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{user.phone}</span>
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{user.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  Born in {user.YOB}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.username || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.userAccount.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.phone || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Year of Birth</Label>
                <p className="text-sm text-muted-foreground py-2">{user.YOB}</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.role}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.status}
                </p>
              </div>

              <div className="space-y-2">
                <Label>NFC Card UID</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {user.nfcCardUid || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <p className="text-sm text-muted-foreground py-2">
                {user.address || "N/A"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <p className="text-sm text-muted-foreground py-2">
                {user.location || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Account ID</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.accountId}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Account Email</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {user.userAccount.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Verification Status</Label>
                <p className="text-sm text-muted-foreground">
                  <Badge
                    variant={user.verify === "verified" ? "success" : "warning"}
                  >
                    {user.verify === "verified"
                      ? "Verified"
                      : "Pending Verification"}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">
                    {formatToVNTime(user.createdAt || "")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Updated: </span>
                  <span className="font-medium">
                    {formatToVNTime(user.updatedAt || "")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
