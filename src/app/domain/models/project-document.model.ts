export interface ProjectDocument {
  id: number;
  projectId: number;
  title: string;
  category: string;
  version: string;
  filePath: string;
  uploadedBy: number;
  uploadedAt: string;
}
