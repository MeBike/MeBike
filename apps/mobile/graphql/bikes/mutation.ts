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
export const CHANGE_BIKE_STATUS = gql`
  mutation Mutation($changeBikeStatusId: String!, $status: BikeStatus!) {
    ChangeBikeStatus(id: $changeBikeStatusId, status: $status) {
      success
      message
      errors
      statusCode
    }
  }
`;