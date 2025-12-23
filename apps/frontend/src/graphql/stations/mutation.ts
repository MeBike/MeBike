import { gql } from "@apollo/client";
export const CREARTE_STATION = gql`
  mutation Mutation($body: CreateStationInput!) {
    CreateStation(body: $body) {
      errors
      message
      statusCode
      success
    }
  }
`;
