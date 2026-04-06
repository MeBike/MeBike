import { AuthHeader } from "@ui/patterns/auth-header";

type ResetPasswordOtpHeaderProps = {
  onBack: () => void;
  email: string;
};

export function ResetPasswordOtpHeader({ onBack, email }: ResetPasswordOtpHeaderProps) {
  return (
    <AuthHeader
      onBack={onBack}
      size="compact"
      subtitle={`Chúng tôi đã gửi mã OTP tới\n${email}`}
      title="Nhập mã OTP"
    />
  );
}
