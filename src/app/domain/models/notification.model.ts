export interface Notification {
  idNotification: number;
  userId: number;
  clientId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}
