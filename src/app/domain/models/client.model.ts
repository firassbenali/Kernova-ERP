export interface Contact {
  idContact?: number;
  clientId?: number;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  isPrimary?: boolean;
  notes?: string;
}

export type AppointmentStatus = 'Pending' | 'Accepted' | 'Refused' | 'Completed';

export interface Appointment {
  idAppointment?: number;
  clientId: number;
  adminId?: number;
  subject: string;
  description?: string;
  appointmentDate: string;
  location?: string;
  status: AppointmentStatus;
  createdAt?: string;
}

export interface Client {
  idClient?: number;
  userId?: number;
  reference?: string;
  companyName: string;
  logo?: string;
  sector?: string;
  website?: string;
  email: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  description?: string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
  contacts?: Contact[];
  createAccount?: boolean;
  initialPassword?: string;
  password?: string;
}

export interface ClientFilters {
  query?: string;
  sector?: string;
  city?: string;
  country?: string;
}
