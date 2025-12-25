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