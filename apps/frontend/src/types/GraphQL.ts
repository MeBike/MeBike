export interface GraphQLResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
  errors?: { message: string; [key: string]: string }[];
  statusCode?: number;
}
