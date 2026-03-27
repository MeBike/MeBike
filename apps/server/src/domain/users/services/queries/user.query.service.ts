import type { UserRepo } from "../../repository/user.repository";
import type { UserService } from "../user.service.types";

export type UserQueryService = Pick<
  UserService,
  | "getById"
  | "getByEmail"
  | "findByStripeConnectedAccountId"
  | "listWithOffset"
  | "searchByQuery"
  | "listTechnicianSummaries"
  | "listAvailableTechnicianTeams"
>;

export function makeUserQueryService(repo: UserRepo): UserQueryService {
  return {
    getById: id => repo.findById(id),
    getByEmail: email => repo.findByEmail(email),
    findByStripeConnectedAccountId: accountId => repo.findByStripeConnectedAccountId(accountId),
    listWithOffset: (filter, pageReq) => repo.listWithOffset(filter, pageReq),
    searchByQuery: query => repo.searchByQuery(query),
    listTechnicianSummaries: () => repo.listTechnicianSummaries(),
    listAvailableTechnicianTeams: args => repo.listAvailableTechnicianTeams(args),
  };
}
