import { AuthHeader } from "@ui/patterns/auth-header";

type RegisterHeaderProps = {
  onBack: () => void;
};

function RegisterHeader({ onBack }: RegisterHeaderProps) {
  return (
    <AuthHeader
      onBack={onBack}
      size="compact"
      subtitle="Tham gia cộng đồng MeBike"
      title="Tạo tài khoản"
    />
  );
}

export default RegisterHeader;
