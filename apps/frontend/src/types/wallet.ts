import type {
  GraphQLMutationResponse,
} from "@/types/GraphQL";
export interface Wallet {
    id : string;
    accountId : string;
    balance : number;
    status : "ACTIVE" | "INACTIVE";
    createdAt : string;
    updatedAt : string;
}
export type GetAllWalletResponse = GraphQLMutationResponse<"GetAllWallets", Wallet[]>;