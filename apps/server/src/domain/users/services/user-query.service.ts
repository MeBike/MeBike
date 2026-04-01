import type { UserQueryRepo } from "../repository/user-query.repository";
import type { UserQueryService } from "./user.service.types";

export function makeUserQueryService(repo: UserQueryRepo): UserQueryService {
  return {
    getById: id => repo.findById(id),
    getByEmail: email => repo.findByEmail(email),
    findByStripeConnectedAccountId: accountId => repo.findByStripeConnectedAccountId(accountId),
    listWithOffset: (filter, pageReq) => repo.listWithOffset(filter, pageReq),
    searchByQuery: query => repo.searchByQuery(query),
    listTechnicianSummaries: () => repo.listTechnicianSummaries(),
  };
}
