import { gql } from "@apollo/client";
export const CREATE_STATION = gql`
  mutation Mutation($body: CreateStationInput!) {
    CreateStation(body: $body) {
      errors
      message
      statusCode
      success
    }
  }
`;
export const UPDATE_STATION = gql`
  mutation UpdateStation(
    $body: UpdateStationInput!
    $updateStationId: String!
  ) {
    UpdateStation(body: $body, id: $updateStationId) {
      errors
      message
      statusCode
      success
    }
  }
`;
export const UPDATE_STATUS_STATION = gql`
  mutation UpdateStationStatus($body: UpdateStationStatusInput!) {
    UpdateStationStatus(body: $body) {
      errors
      message
      statusCode
      success
    }
  }
`;