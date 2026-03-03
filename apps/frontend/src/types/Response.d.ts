export interface ApiResponse<T> {
  data: T;
  pagination : Pagination
}
export interface Pagination {
  currentPage: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  page : number;
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
