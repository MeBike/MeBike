import { gql } from "@apollo/client";
export const GET_STATIONS = gql`
  query Stations($params: GetStationInput) {
  Stations(params: $params) {
    success
    message
    data {
      address
      capacity
      createdAt
      distance
      id
      latitude
      longitude
      name
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
export const GET_DETAIL_STATION = gql`
query Staion($staionId: String!) {
  Staion(id: $staionId) {
    success
    message
    data {
      address
      capacity
      createdAt
      distance
      id
      latitude
      longitude
      name
      updatedAt
    }
    errors
    statusCode
  }
}`