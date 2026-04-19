import { AuthHeader } from "@ui/patterns/auth-header";

import BackendStatusIndicator from "./backend-status";

type LoginHeaderProps = {
  canGoBack?: boolean;
  onBack?: () => void;
  backendStatus: "checking" | "online" | "offline";
};

function LoginHeader({ canGoBack = false, onBack, backendStatus }: LoginHeaderProps) {
  return (
    <AuthHeader
      accessory={__DEV__ ? <BackendStatusIndicator backendStatus={backendStatus} /> : undefined}
      onBack={canGoBack ? onBack : undefined}
      subtitle="Chào mừng bạn trở lại"
      title="Đăng nhập"
    />
  );
}

export default LoginHeader;
