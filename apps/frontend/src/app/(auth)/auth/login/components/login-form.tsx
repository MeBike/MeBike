import { Mail, Lock, Eye, EyeOff, Loader2, Bike } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
interface LoginFormProps {
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isLoading: boolean;
}

export function LoginForm({
  onSubmit,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Your password"
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pl-10 h-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-4" />
            ) : (
              <Eye className="h-5 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="text-right mt-2">
        <Button
          variant="link"
          onClick={() => router.push("/auth/forgot-password")}
        >
          Forgot Password?
        </Button>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Logging in...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Bike className="h-5 w-5" />
            <span>Log in</span>
          </div>
        )}
      </Button>
    </form>
  );
}
