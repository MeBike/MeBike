import { gql } from "@apollo/client";
export const CREATE_BIKE = gql`
  mutation Mutation($body: CreateBikeInput!) {
    CreateBike(body: $body) {
      success
      message
      errors
      statusCode
    }
  }
`;