export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  workflowData: Record<string, any>;
  metadata: TemplateMetadata;
}

export interface TemplateMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author?: string;
  tags: string[];
  compatibility?: string[];
  downloads: number;
  rating: number;
}

export enum TemplateCategory {
  WebAutomation = 'web-automation',
  FileProcessing = 'file-processing',
  DataEntry = 'data-entry',
  SystemOperation = 'system-operation',
  EmailHandling = 'email-handling',
  Custom = 'custom',
}

export interface TemplateImportOptions {
  overwrite?: boolean;
  preserveMetadata?: boolean;
}

export interface TemplateExportOptions {
  includeMetadata?: boolean;
  format?: 'json' | 'zip';
}
