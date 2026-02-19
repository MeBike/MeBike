interface AuthResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
  detail?: {
    [key: string]: string;
  }
}
interface MessageResponse {
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}
interface ResetTokenResponse {
  data : {
    resetToken : string;
  }
}
export type { AuthResponse, MessageResponse, ResetTokenResponse };