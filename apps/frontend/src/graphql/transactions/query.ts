import { gql } from "@apollo/client";
export const GET_ALL_WALLET = gql`
  query GetAllWallets {
  GetAllWallets {
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
    pagination {
      total
      page
      limit
      totalPages
    }
  }
}
`;
export const GET_ALL_TRANSACTION = gql `
query GetTransaction($getTransactionId: String!) {
  GetTransaction(id: $getTransactionId) {
    success
    message
    data {
      id
      accountId
      type
      status
      amount
      paymentMethod
      description
      createdAt
      updatedAt
    }
    errors
    statusCode
  }
}`