export type Transaction = {
  id: string;
  amount: string;
  description?: string | null;
  type: string;
  status: string;
  createdAt: string;
  hash?: string | null;
};
