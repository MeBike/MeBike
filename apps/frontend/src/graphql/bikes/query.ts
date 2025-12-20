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
    }
  }
`;