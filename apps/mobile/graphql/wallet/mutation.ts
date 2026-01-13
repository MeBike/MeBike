import { gql } from "@apollo/client";
export const CREATE_PAYMENT = gql`
  mutation CreatePayment($body: CreatePaymentInput!) {
    CreatePayment(body: $body) {
      success
      message
      data {
        paymentUrl
      }
      errors
      statusCode
    }
  }
`;
