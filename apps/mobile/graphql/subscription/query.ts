import { gql } from "@apollo/client";

export const GET_PACKAGES = gql`
  query Packages($params: GetPackageListInput) {
    Packages(params: $params) {
      success
      message
      data {
        id
        name
        price
        maxUsages
        usageType
        status
        createdAt
        updatedAt
      }
      errors
      statusCode
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const GET_SUBSCRIPTIONS = gql`
  query Subscriptions($params: GetSubscriptionListInput) {
    Subscriptions(params: $params) {
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
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const GET_SUBSCRIPTION_DETAIL = gql`
  query Subscription($id: String!) {
    Subscription(id: $id) {
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
