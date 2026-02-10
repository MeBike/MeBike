-- Drop legacy OTP columns now handled via Redis in auth repository
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "email_verify_otp",
  DROP COLUMN IF EXISTS "email_verify_otp_expires",
  DROP COLUMN IF EXISTS "forgot_password_otp",
  DROP COLUMN IF EXISTS "forgot_password_otp_expires";
