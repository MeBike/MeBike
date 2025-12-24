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
export const UPDATE_SUPPLIER = gql`
  mutation Mutation($body: UpdateSupplierInput!, $updateSupplierId: String!) {
    UpdateSupplier(body: $body, id: $updateSupplierId) {
      success
      message
      errors
      statusCode
    }
  }
`;