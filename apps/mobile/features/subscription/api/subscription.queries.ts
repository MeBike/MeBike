export const PACKAGES_QUERY = `
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

export const SUBSCRIPTIONS_QUERY = `
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

export const SUBSCRIPTION_DETAIL_QUERY = `
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
