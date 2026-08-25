export interface EmployeeSkill {
  employeeId: number;
  skillId: number;
  skillName: string;
  level: SkillLevel;
  targetLevel: SkillLevel;
  yearsOfExperience: number;
  lastAssessedDate: string;
  certificationStatus: string;
}

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface AssignSkillRequest {
  skillId: number;
  level: SkillLevel;
  targetLevel?: SkillLevel;
  yearsOfExperience?: number;
}

export interface UpdateSkillLevelRequest {
  level: SkillLevel;
  targetLevel?: SkillLevel;
  yearsOfExperience?: number;
}