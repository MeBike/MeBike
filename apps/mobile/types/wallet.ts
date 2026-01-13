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
export interface PaymentUrl {
    paymentUrl : string 
}
export type GetMyWalletResponse = GraphQLMutationResponse<"GetWallet", Wallet>;
export type CreatePaymentResponse = GraphQLMutationResponse<"CreatePayment" , PaymentUrl>