import { useCallback, useEffect, useState } from "react";

const OTP_EXPIRY = 10 * 60;
const _RESEND_COOLDOWN = 60;

export function useOtpTimers(visible: boolean) {
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);

  const resetTimers = useCallback(() => {
    setTimeLeft(OTP_EXPIRY);
    setResendTimeLeft(0);
  }, []);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(OTP_EXPIRY);
      setResendTimeLeft(0);
    }
  }, [visible]);

  useEffect(() => {
    if (timeLeft <= 0 || !visible)
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, visible]);

  useEffect(() => {
    if (resendTimeLeft <= 0 || !visible)
      return;

    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimeLeft, visible]);

  return {
    timeLeft,
    resendTimeLeft,
    resetTimers,
  };
}
