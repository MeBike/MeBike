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
      data {
        accessToken
        refreshToken
      }
      message
      statusCode
      success
      errors
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
export const LOGOUT_MUTATION = gql`
  mutation LogoutUser {
    LogoutUser {
      success
      message
      errors
      statusCode
    }
  }
`;
export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($body: ChangePasswordInput!) {
    ChangePassword(body: $body) {
      success
      message
      errors
      statusCode
    }
  }
`;