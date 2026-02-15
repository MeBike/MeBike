import { USERS_MESSAGES , AUTH_MESSAGE } from "@/constants/messages";
const mapErrorMessage = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    USER_NOT_FOUND: "User does not exist",
    INVALID_CREDENTIALS: "Đăng nhập thất bại! Email hoặc mật khẩu không chính xác",
  };

  return errorMap[errorCode] || "An unknown error occurred";
}
const getErrorMessageUserFromCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return USERS_MESSAGES[code as keyof typeof USERS_MESSAGES] 
    || "Something went wrong";
};
const getErrorMessageAuthFromCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return AUTH_MESSAGE[code as keyof typeof AUTH_MESSAGE] 
    || "Something went wrong";
}
export { getErrorMessageUserFromCode, getErrorMessageAuthFromCode, mapErrorMessage };