export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Refused';

export interface Quote {
  idQuote?: number;
  clientId: number;
  adminId?: number;
  reference?: string;
  title: string;
  amount: number;
  tax?: number;
  discount?: number;
  total?: number;
  issueDate?: string;
  expirationDate?: string;
  status: QuoteStatus;
}
