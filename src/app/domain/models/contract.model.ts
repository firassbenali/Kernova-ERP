export type ContractStatus = 'Draft' | 'Sent' | 'Signed' | 'Expired' | 'Cancelled';

export interface Contract {
  idContract?: number;
  clientId: number;
  quoteId?: number;
  adminId?: number;
  reference?: string;
  title: string;
  description?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  currency?: string;
  status: ContractStatus;
  signedDate?: string;
  signedBy?: string;
  createdAt?: string;
}
