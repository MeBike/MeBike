export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface ErrorResponseClient {
  success: boolean;
  message: string;
  errors?: string[];
}
