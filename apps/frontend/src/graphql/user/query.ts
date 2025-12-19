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