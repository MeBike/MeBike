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
  mutation RefreshToken($refreshToken: String!) {
    RefreshToken(refreshToken: $refreshToken) {
      success
      message
      data {
        accessToken
      }
      errors
      statusCode
    }
  }
`;