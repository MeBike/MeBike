interface AuthResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}
interface MessageResponse {
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}
export type { AuthResponse, MessageResponse };