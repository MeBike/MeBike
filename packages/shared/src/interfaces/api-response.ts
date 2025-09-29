export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
};

export type ErrorResponse = {
  success: boolean;
  message: string;
  errors?: string[];
};
