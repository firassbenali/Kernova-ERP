export interface DocumentModel {
  idDocument?: number;
  clientId?: number;
  uploadedBy?: number;
  title: string;
  category?: string;
  fileName?: string;
  filePath?: string;
  fileType?: string;
  version?: string;
  description?: string;
  uploadedAt?: string;
}
