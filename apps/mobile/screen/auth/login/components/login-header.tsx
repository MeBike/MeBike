import { AuthHeader } from "@ui/patterns/auth-header";

import BackendStatusIndicator from "./backend-status";

type LoginHeaderProps = {
  onBack: () => void;
  backendStatus: "checking" | "online" | "offline";
};

function LoginHeader({ onBack, backendStatus }: LoginHeaderProps) {
  return (
    <AuthHeader
      accessory={__DEV__ ? <BackendStatusIndicator backendStatus={backendStatus} /> : undefined}
      onBack={onBack}
      subtitle="Chào mừng bạn trở lại"
      title="Đăng nhập"
    />
  );
}

export default LoginHeader;
