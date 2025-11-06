import { WorkflowTemplate, TemplateImportOptions, TemplateExportOptions } from './types';

export class TemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();

  addTemplate(template: WorkflowTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template ${template.id} already exists`);
    }
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  searchTemplates(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  updateTemplate(id: string, updates: Partial<WorkflowTemplate>): void {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    const updated = { ...template, ...updates };
    updated.metadata.updatedAt = new Date();
    this.templates.set(id, updated);
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  exportTemplate(id: string, options: Partial<TemplateExportOptions> = {}): string {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    const exportData = {
      ...template,
      metadata: options.includeMetadata !== false ? template.metadata : undefined,
    };

    return JSON.stringify(exportData, null, 2);
  }

  importTemplate(
    jsonData: string,
    options: Partial<TemplateImportOptions> = {}
  ): WorkflowTemplate {
    const template = JSON.parse(jsonData) as WorkflowTemplate;

    if (!options.overwrite && this.templates.has(template.id)) {
      throw new Error(`Template ${template.id} already exists`);
    }

    if (!options.preserveMetadata) {
      template.metadata.createdAt = new Date();
      template.metadata.updatedAt = new Date();
    }

    this.templates.set(template.id, template);
    return template;
  }

  cloneTemplate(id: string, newName: string): WorkflowTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    const cloned: WorkflowTemplate = {
      ...template,
      id: `${template.id}_clone_${Date.now()}`,
      name: newName,
      metadata: {
        ...template.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    this.templates.set(cloned.id, cloned);
    return cloned;
  }
}
