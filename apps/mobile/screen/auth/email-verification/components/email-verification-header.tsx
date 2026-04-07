import { AuthHeader } from "@ui/patterns/auth-header";

type EmailVerificationHeaderProps = {
  email: string;
  onBack: () => void;
};

export function EmailVerificationHeader({ email, onBack }: EmailVerificationHeaderProps) {
  return (
    <AuthHeader
      onBack={onBack}
      size="compact"
      subtitle={`Chúng tôi đã gửi mã OTP đến\n${email}`}
      title="Xác nhận Email"
    />
  );
}
