import { gql } from "@apollo/client";
export const GET_USERS = gql`
  query Users($params: GetUsersInput) {
    Users(params: $params) {
      success
      message
      data {
        id
        accountId
        name
        YOB
        role
        verify
        status
        phone
        address
        avatarUrl
        nfcCardUid
        createdAt
        updatedAt
        userAccount {
          id
          email
          password
        }
      }
      errors
      statusCode
      total
      page
      limit
      totalPages
    }
  }
`;
export const GET_DETAIL_USER = gql`
  query User($params: String) {
    User(params: $params) {
      data {
        id
        accountId
        name
        YOB
        role
        verify
        status
        phone
        userAccount {
          id
          email
          password
        }
        address
        avatarUrl
        nfcCardUid
        createdAt
        updatedAt
      }
      pagination {
        totalPages
        totalRecords
        limit
        currentPage
      }
      message
      statusCode
      success
      errors
    }
  }
`;
export const GET_USER_STATS = gql`
query GetUserStats {
  GetUserStats {
    success
    message
    data {
      totalUsers
      totalUser
      totalUserUnverfied
      totalStaff
      totalAdmin
      totalSos
    }
    errors
    statusCode
  }
}`