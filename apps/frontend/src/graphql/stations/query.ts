import { gql } from "@apollo/client";
export const GET_STATIONS = gql`
  query Stations($params: GetStationInput) {
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
      distance
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
    errors
    statusCode
    pagination {
      total
      page
      limit
      totalPages
    }
    activeStation
    inactiveStation
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
            id
            address
          }
          status
          createdAt
          updatedAt
          supplier {
            name
            id
          }
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
