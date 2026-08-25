export enum SkillCategory {
  Technical = 'Technical',
  SoftSkill = 'Soft Skill',
  Management = 'Management',
  Language = 'Language',
  Certification = 'Certification',
  Domain = 'Domain'
}

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  description: string;
  active: boolean;
}

export interface SkillCategoryFilter {
  category: SkillCategory;
  searchTerm: string;
}