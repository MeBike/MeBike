export interface ApiResponse<T> {
  data: T;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
export interface DetailApiResponse<T> {
  result: T;
  message: string;
}
export interface DetailApiResponseCuaNguyen<T> {
  result: {
    data: T;
  };
  message: string;
}
export interface DeleteResponse {
  message?: string;
}
