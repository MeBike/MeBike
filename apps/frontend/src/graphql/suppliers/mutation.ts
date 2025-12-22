import { gql } from "@apollo/client";
export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($body: CreateSupplierInput!) {
    CreateSupplier(body: $body) {
      success
      message
      errors
      statusCode
    }
  }
`;
