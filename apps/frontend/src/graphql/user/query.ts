import { gql } from "@apollo/client";
export const GET_USERS = gql`
  query Query($params: GetUsersInput) {
    Users(params: $params) {
      success
      message
      errors
      statusCode
      pagination {
        total
        page
        limit
        totalPages
      }
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
    }
  }
`;

export const GET_DETAIL_USER = gql`
  query User($params: String) {
    User(params: $params) {
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
      errors
      statusCode
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
  }
`;
