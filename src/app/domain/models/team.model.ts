import { Employee } from './employee.model';

export interface Team {
  id: number;
  name: string;
  leaderId: number;
  leaderName: string;
  memberCount?: number;
  members?: Employee[];
}

export interface CreateTeamRequest {
  name: string;
  leaderId: number;
}

export interface UpdateTeamRequest {
  name: string;
  leaderId: number;
}
