import { gql } from "@apollo/client";
export const CREATE_BIKE = gql`
  mutation CreateBike($body: CreateBikeInput!) {
    CreateBike(body: $body) {
      errors
      message
      statusCode
      success
    }
  }
`;
export const UPDATE_BIKE = gql`
  mutation UpdateBike($body: UpdateBikeInput!, $updateBikeId: String!) {
    UpdateBike(body: $body, id: $updateBikeId) {
      success
      message
      errors
      statusCode
    }
  }
`;