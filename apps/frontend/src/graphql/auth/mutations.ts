import { gql } from "@apollo/client";
export const LOGIN_MUTATION = gql`
  mutation LoginUser($body: LoginInput!) {
    LoginUser(body: $body) {
      success
      message
      data {
        accessToken
        refreshToken
      }
      errors
      statusCode
    }
  }
`;
export const REGISTER_MUTATION = gql`
  mutation RegisterUser($body: RegisterUserInput!) {
    RegisterUser(body: $body) {
      success
      message
      data {
        id
        email
        password
      }
      errors
      statusCode
    }
  }
`;
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    RefreshToken {
      success
      message
      data {
        accessToken
        refreshToken
      }
      errors
      statusCode
    }
  } 
`;
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
        userAccount {
          email
          id
          password
        }
      }
      errors
      statusCode
    }
  }
`;
