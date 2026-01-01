import { gql } from "@apollo/client";
export const CREATE_USER = gql`
  mutation CreateUser($body: CreateUserInput!) {
    CreateUser(body: $body) {
      success
      message
      errors
      statusCode
      data {
        email
        id
        password
      }
    }
  }
`;
export const CHANGE_STATUS_USER = gql`
  mutation Mutation($data: ChangeUserStatusInput!) {
    ChangeUserStatus(data: $data) {
      errors
      statusCode
      message
      success
    }
  }
`;
