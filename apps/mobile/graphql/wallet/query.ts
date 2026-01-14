import { gql } from "@apollo/client";
export const GET_MY_WALLET = gql`
 query GetWallet {
  GetWallet {
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
