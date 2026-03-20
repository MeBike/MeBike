import { AuthHeader } from "@ui/patterns/auth-header";

type ForgotPasswordHeaderProps = {
  onBack: () => void;
};

export function ForgotPasswordHeader({ onBack }: ForgotPasswordHeaderProps) {
  return (
    <AuthHeader
      onBack={onBack}
      size="compact"
      subtitle="Vui lòng nhập email để nhận mã OTP"
      title="Đổi mật khẩu"
    />
  );
}
