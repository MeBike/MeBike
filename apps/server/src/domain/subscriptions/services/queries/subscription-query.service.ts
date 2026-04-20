import type { SubscriptionQueryRepo } from "../../repository/subscription.repository.types";
import type { SubscriptionQueryService } from "../subscription.service.types";

/**
 * Tao query service mong cho subscriptions.
 * Service nay chu yeu forward sang query repo de phan doc van don gian va de lan theo.
 *
 * @param repo Query repository cho cac luong doc subscriptions.
 */
export function makeSubscriptionQueryService(
  repo: SubscriptionQueryRepo,
): SubscriptionQueryService {
  return {
    getById: subscriptionId => repo.findById(subscriptionId),
    getAdminById: subscriptionId => repo.findAdminById(subscriptionId),
    getCurrentForUser: (userId, statuses) => repo.findCurrentForUser(userId, statuses),
    listForUser: (userId, filter, pageReq) => repo.listForUser(userId, filter, pageReq),
    listAll: (filter, pageReq) => repo.listAll(filter, pageReq),
  };
}
