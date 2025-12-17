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
    const responseData = (axiosError as any).response?.data;
    console.log(responseData);
    if (responseData?.errors?.length) {
      return responseData.errors
        .map((e: any) =>
          typeof e === "string" ? e : e.message || JSON.stringify(e)
        )
        .join(", ");
    }
    const mutationData = responseData?.data;
    console.log(mutationData);
    if (mutationData) {
      const allErrors: string[] = [];
      Object.values(mutationData).forEach((result: any) => {
        if (result?.errors?.length) {
          allErrors.push(
            ...result.errors.map((e: any) =>
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
