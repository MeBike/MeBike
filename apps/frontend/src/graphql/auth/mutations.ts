export const LOGIN_MUTATION = `
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
