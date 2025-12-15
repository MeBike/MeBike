export type DomainPage = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ContractPage = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function toContractPage(page: DomainPage): ContractPage {
  return {
    page: page.page,
    limit: page.pageSize,
    total: page.total,
    totalPages: page.totalPages,
  };
}
