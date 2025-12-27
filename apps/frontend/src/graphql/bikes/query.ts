import { gql } from "@apollo/client";
export const GET_BIKES = gql`
  query Bikes($params: GetBikeInput) {
  Bikes(params: $params) {
    success
    message
    data {
      id
      chipId
      station {
        id
        name
      }
      supplier {
        id
        name
      }
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
export const GET_DETAIL_BIKES = gql`
  query Bike($bikeId: String!) {
    Bike(id: $bikeId) {
      success
      message
      data {
        id
        chipId
        station {
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
        supplier {
          id
          name
          contactInfo {
            phone
            address
          }
          contactFee
          status
          createdAt
          updatedAt
        }
        status
        createdAt
        updatedAt
      }
      errors
      statusCode
    }
  }
`;