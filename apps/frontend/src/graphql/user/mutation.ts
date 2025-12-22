import { gql } from "@apollo/client";
export const CREATE_USER = gql`
  mutation Mutation($body: CreateUserInput!) {
    CreateUser(body: $body) {
      data {
        id
        email
        password
      }
      errors
      message
      statusCode
      success
    }
  }
`;