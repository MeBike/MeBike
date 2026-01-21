export const CREATE_SUBSCRIPTION_MUTATION = `
  mutation CreateSubscription($body: CreateSubscriptionInput!) {
    CreateSubscription(body: $body) {
      success
      message
      data {
        id
        status
        activatedAt
        expiredAt
        usageCounts
        package {
          id
          name
          price
          maxUsages
          usageType
          status
        }
      }
      errors
      statusCode
    }
  }
`;

export const ACTIVATE_SUBSCRIPTION_MUTATION = `
  mutation ActivateSubscription($id: String!) {
    ActivateSubscription(id: $id) {
      success
      message
      data {
        id
        status
        activatedAt
        expiredAt
        usageCounts
        package {
          id
          name
          price
          maxUsages
          usageType
          status
        }
      }
      errors
      statusCode
    }
  }
`;
