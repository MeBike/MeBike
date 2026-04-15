import type { SubscriptionQueryRepo } from "../repository/subscription.repository.types";
import type { SubscriptionQueryService } from "./subscription.service.types";

/**
 * Tạo query service mỏng cho subscriptions.
 * Service này chủ yếu forward sang query repo để phần đọc vẫn đơn giản và dễ lần theo.
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
