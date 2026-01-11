import { AxiosError } from "axios";
import type {
  GraphQLMutationResponse,
  BaseMutationResponse,
  ErrorObject,
} from "@/types/GraphQL";

// Helper type to handle potential AxiosError type mismatches in the environment
type SafeAxiosError<T> = AxiosError<T> & {
  response?: {
    data: T;
  };
};
export const getErrorMessage = <MutationName extends string = string>(
  error: unknown,
  defaultMessage = "Something went wrong"
): string => {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as SafeAxiosError<
      GraphQLMutationResponse<MutationName>
    >;
    const responseData = axiosError.response?.data;
    console.log(responseData);
    if (responseData?.errors?.length) {
      return responseData.errors
        .map((e: string | ErrorObject) =>
          typeof e === "string" ? e : e.message || JSON.stringify(e)
        )
        .join(", ");
    }
    const mutationData = responseData?.data;
    console.log(mutationData);
    if (mutationData) {
      const allErrors: string[] = [];
      Object.values(mutationData).forEach((r) => {
        const result = r as BaseMutationResponse<unknown>;
        if (result?.errors?.length) {
          allErrors.push(
            ...result.errors.map((e: string | ErrorObject) =>
              typeof e === "string" ? e : e.message || JSON.stringify(e)
            )
          );
        } else if (result?.message) {
          allErrors.push(result.message);
        }
      });

      if (allErrors.length > 0) {
        return allErrors.join(", ");
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return defaultMessage;
};
