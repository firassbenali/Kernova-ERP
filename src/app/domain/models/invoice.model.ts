export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface Invoice {
  idInvoice?: number;
  clientId: number;
  contractId?: number;
  adminId?: number;
  reference?: string;
  amount: number;
  tax?: number;
  total?: number;
  paymentStatus: PaymentStatus;
  issueDate?: string;
  dueDate?: string;
}
