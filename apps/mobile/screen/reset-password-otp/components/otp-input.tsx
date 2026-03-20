import { OtpCodeInput } from "@ui/primitives/otp-code-input";

type OtpInputProps = {
  otp: string[];
  disabled: boolean;
  onChangeDigit: (index: number, value: string) => void;
};

export function OtpInput({ otp, disabled, onChangeDigit }: OtpInputProps) {
  return <OtpCodeInput disabled={disabled} otp={otp} onChangeDigit={onChangeDigit} />;
}
