import { AxiosError } from "axios";
import type { GraphQLMutationResponse } from "@/types/GraphQL";

export const getErrorMessage = <MutationName extends string = string>(
  error: unknown,
  defaultMessage = "Something went wrong"
): string => {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as AxiosError<
      GraphQLMutationResponse<MutationName>
    >;
    const responseData = axiosError.zresponse?.data;
    if (responseData?.errors?.length) {
      return responseData.errors
        .flatMap((err) => (err.errors?.length ? err.errors : err.message))
        .join(", ");
    }
    const mutationData = responseData?.data;
    if (mutationData) {
      const firstKey = Object.keys(mutationData)[0] as MutationName;
      const result = mutationData[firstKey];

      if (result?.errors?.length) {
        return result.errors.map((err) => err.message).join(", ");
      }

      if (result?.message) {
        return result.message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return defaultMessage;
};
