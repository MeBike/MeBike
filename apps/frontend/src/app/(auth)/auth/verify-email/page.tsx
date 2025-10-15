"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { useAuthActions } from "@/hooks/useAuthAction";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuthActions();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [hasVerified, setHasVerified] = useState<boolean>(false); 
  useEffect(() => {
    const token = searchParams.get("email_verify_token");
    if (!token) {
      setStatus("error");
      setMessage("Token xác thực không hợp lệ");
      return;
    }
    if (hasVerified) {
      return; 
    }
    console.log("Starting email verification with token:", token);
    setHasVerified(true); 
    verifyEmail(token)
      .then(() => {
        console.log("Email verification successful");
        setStatus("success");
        setMessage("Xác thực email thành công!");
        setTimeout(() => {
          console.log("Navigating to /staff/profile");
          router.push("/staff/profile");
        }, 3000);
      })
      .catch((error) => {
        console.error("Email verification failed:", error);
        setStatus("error");
        setMessage("Xác thực email thất bại. Vui lòng thử lại.");
        setHasVerified(false); 
      });

  }, [searchParams, router]); 

  const handleGoBack = () => {
    router.push("/staff/profile");
  };
  const handleResendVerifyEmail = () => {
    setHasVerified(false);
    router.refresh();
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Xác thực Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Đang xác thực email của bạn...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="text-green-600 font-medium">{message}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bạn sẽ được chuyển hướng về trang hồ sơ trong 3 giây...
                  </p>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <div className="text-center">
                  <p className="text-red-600 font-medium">{message}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vui lòng kiểm tra lại link xác thực hoặc yêu cầu gửi lại
                    email.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại hồ sơ
            </Button>

            {status === "error" && (
              <Button
                onClick={() => handleResendVerifyEmail()}
                className="w-full"
              >
                Gửi lại email xác thực
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Xác thực Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Đang tải...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}