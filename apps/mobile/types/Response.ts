export interface ApiResponse<T> {
  data: T;
  pagination: {
    totalPages: number;
    currentPage: number;
    limit: number;
    totalRecords: number;
  };
  message: string;
}
export interface DetailApiResponse<T> {
  data: T;
  message: string;
}
export interface DetailApiResponseCuaNguyen<T> {
  result: {
    data: T;
  };
  message: string;
}
