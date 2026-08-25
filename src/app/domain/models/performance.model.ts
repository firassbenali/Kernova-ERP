export type PerformanceStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

export interface PerformanceCriterion {
  id: number;
  name: string;
  description?: string;
  weight: number;
  active: boolean;
}

export interface PerformanceEvaluation {
  id?: number;
  performanceReviewId?: number;
  criterionId: number;
  criterionName?: string;
  criterionWeight?: number;
  score: number;
  comment?: string;
}

export interface PerformanceReview {
  id: number;
  employeeId: number;
  employeeName?: string;
  reviewerId?: number;
  reviewerName?: string;
  reviewPeriod: string;
  reviewDate: string;
  status: PerformanceStatus;
  overallScore?: number;
  comments?: string;
  strengths?: string;
  improvementAreas?: string;
  createdAt?: string;
  updatedAt?: string;
  evaluations: PerformanceEvaluation[];
}

export interface EvaluationRequest {
  criterionId: number;
  score: number;
  comment?: string;
}

export interface CreatePerformanceReviewRequest {
  employeeId: number;
  reviewerId?: number;
  reviewPeriod: string;
  reviewDate: string;
  comments?: string;
  strengths?: string;
  improvementAreas?: string;
  evaluations: EvaluationRequest[];
}

export interface UpdatePerformanceReviewRequest {
  reviewerId?: number;
  reviewPeriod?: string;
  reviewDate?: string;
  comments?: string;
  strengths?: string;
  improvementAreas?: string;
  evaluations: EvaluationRequest[];
}

export interface SaveCriterionRequest {
  name: string;
  description?: string;
  weight: number;
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ReviewFilters {
  employeeId?: number;
  departmentId?: number;
  positionId?: number;
  reviewerId?: number;
  status?: string;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface EmployeeScoreEntry {
  employeeId: number;
  employeeName: string;
  averageScore: number;
  reviewCount: number;
}

export interface DepartmentAverageEntry {
  departmentName: string;
  averageScore: number;
  reviewCount: number;
}

export interface TrendPoint {
  periodLabel: string;
  averageScore: number;
  reviewCount: number;
}

export interface CriterionBreakdown {
  criterionId: number;
  criterionName: string;
  weight: number;
  averageScore: number;
  evaluationCount: number;
}

export interface PerformanceStats {
  companyAverageScore?: number;
  completedReviews: number;
  pendingReviews: number;
  departmentAverages: DepartmentAverageEntry[];
  topPerformers: EmployeeScoreEntry[];
  needsImprovement: EmployeeScoreEntry[];
  trend: TrendPoint[];
}

export interface EmployeePerformanceSummary {
  employeeId: number;
  employeeName?: string;
  departmentName?: string;
  positionTitle?: string;
  averageScore?: number;
  lastScore?: number;
  reviewCount: number;
  criterionBreakdown: CriterionBreakdown[];
  reviews: PerformanceReview[];
}
