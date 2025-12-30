"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@providers/auth-providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { LoginHeader } from "./components/login-header";
import { LoginForm } from "./components/login-form";
import LoginFooter from "./components/login-footer";
export default function LoginPage() {
  const { user, logIn, isLoggingIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const routes = {
        ADMIN: "/admin",
        STAFF: "/staff/customers",
        USER: "/user",
        SOS: "/sos/profile",
      };
      router.push(routes[user.role as keyof typeof routes] || "/");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || isLoading || isNavigating) return;
    setIsNavigating(true);
    try {
      await logIn({ email, password });
    } catch (error) {
      setIsNavigating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)]">
      <div className="w-full max-w-md">
        <LoginHeader />
        <Card className="shadow-floating border-0 bg-white/95 backdrop-blur-xl animate-scale-in">
          <div className="h-1 bg-gradient-metro rounded-t-lg" />
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Log In</CardTitle>
            <CardDescription>
              Welcome back! Please enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLogin}
              isLoading={isLoggingIn || isLoading || isNavigating}
            />
            <Separator className="my-6" />
            <LoginFooter />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
