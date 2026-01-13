import { gql } from "@apollo/client";
export const UPDATE_STATUS_WALLET = gql`
mutation Mutation($body: UpdateWalletStatusInput!) {
  UpdateWalletStatus(body: $body) {
    success
    message
    data {
      id
      accountId
      balance
      status
      createdAt
      updatedAt
    }
    errors
    statusCode
  }
}
`;