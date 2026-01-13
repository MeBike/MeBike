import type {
  GraphQLMutationResponse,
} from "@/types/GraphQL";
export interface Wallet {
    id : string;
    accountId : string;
    balance : number;
    status : "ACTIVE" | "BLOCKED";
    createdAt : string;
    updatedAt : string;
}
export type GetAllWalletResponse = GraphQLMutationResponse<"GetAllWallets", Wallet[]>;
export type UpdateWalletStatusResponse = GraphQLMutationResponse<"UpdateWalletStatus", Wallet>;