import { gql } from "@apollo/client";
export const GET_STATIONS = gql`
  query Query($params: GetStationInput) {
    Stations(params: $params) {
      success
      message
      data {
        id
        name
        address
        latitude
        longitude
        capacity
        totalBike
        availableBike
        bookedBike
        brokenBike
        reservedBike
        maintanedBike
        unavailable
        distance
        status
        createdAt
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
  query Station($stationId: String!) {
    Station(id: $stationId) {
      data {
        id
        name
        address
        latitude
        longitude
        capacity
        totalBike
        distance
        bikes {
          id
          chipId
          station {
            name
            address
          }
          status
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
        status
        availableBike
        bookedBike
        brokenBike
        reservedBike
        maintanedBike
        unavailable
      }
    }
  }
`;