import { gql } from "@apollo/client";

export const CREATE_SUBSCRIPTION = gql`
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
        createdAt
        updatedAt
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

export const ACTIVATE_SUBSCRIPTION = gql`
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
        createdAt
        updatedAt
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
