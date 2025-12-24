import { gql } from "@apollo/client";
export const GET_ALL_SUPPLIER = gql`
  query Suppliers($params: GetSupplierInput) {
    Suppliers(params: $params) {
      success
      message
      data {
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
export const GET_DETAIL_SUPPLIER = gql`
  query Supplier($supplierId: String!) {
    Supplier(id: $supplierId) {
      success
      message
      data {
        contactFee
        contactInfo {
          phone
          address
        }
        createdAt
        id
        name
        status
        updatedAt
      }
      errors
      statusCode
    }
  }
`;
export const GET_STATS_SUPPLIER = gql`
  query Query {
    GetSupplierStats {
      success
      message
      data {
        totalSupplier
        totalSupplierActive
        totalSupplierInactive
        totalBike
        totalAvailableBike
        totalBookedBike
        totalBrokenBike
        totalReservedBike
        totalMaintainedBike
        totalUnAvailableBike
      }
      errors
      statusCode
    }
  }
`;