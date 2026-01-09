import { gql } from "@apollo/client";
export const GET_ME = gql`
  query Query {
    User {
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
        userAccount {
          email
          id
          password
        }
        createdAt
        updatedAt
      }
      errors
      statusCode
    }
  }
`;